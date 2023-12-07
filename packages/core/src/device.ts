import { PickProperty } from '@ngify/types';
import { BehaviorSubject, Observable, Subject, concatAll, filter, from, map, shareReplay, switchMap, take } from 'rxjs';
import { arrayBufferToHex, hexToAscii, splitArray } from './utils';
import { BlueToothDeviceInfoCharacteristicUUIDs, BlueToothGenericAccessCharacteristicUUIDs, DEVICE_INFO_SERVICE_UUID, GENERIC_ACCESS_SERVICE_UUID } from './uuids';

// 空白字符（HEX: 00）
// eslint-disable-next-line no-control-regex
const EMPTY_HEX_REGEX = /\x00/g;

export abstract class AbstractBluetoothLowEnergeDevice {
  abstract readonly characteristicValueChange: Observable<WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult>
  abstract readonly connectedChange: Observable<boolean>;
  abstract readonly rssiChange: Observable<number>
  abstract readonly services: Observable<WechatMiniprogram.BLEService[]>;

  /** 设备名 */
  readonly name = this.genericAccessOf(BlueToothGenericAccessCharacteristicUUIDs.DeviceName);
  /** 产品型号 */
  readonly modelNumber = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.ModelNumber);
  /** 产品序列号 */
  readonly serialNumber = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.SerialNumber);
  /** 固件版本 */
  readonly firmwareRevision = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.FirmwareRevision);
  /** 硬件版本 */
  readonly hardwareRevision = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.HardwareRevision);
  /** 软件版本 */
  readonly softwareRevision = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.SoftwareRevision);
  /** 生产商名称 */
  readonly manufacturerName = this.deviceInfoOf(BlueToothDeviceInfoCharacteristicUUIDs.ManufacturerName);
  /** 当前连接状态 */
  readonly connected = new BehaviorSubject(false);

  protected mtu: number = 23;
  protected readonly destroy$: Subject<void> = new Subject();

  constructor(
    public readonly id: string
  ) { }

  abstract connect(options?: Omit<PickProperty<WechatMiniprogram.CreateBLEConnectionOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  abstract disconnect(): Observable<boolean>;

  abstract getCharacteristics(options: Omit<PickProperty<WechatMiniprogram.GetBLEDeviceCharacteristicsOption>, 'deviceId'>): Observable<WechatMiniprogram.BLECharacteristic[]>

  abstract readCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.ReadBLECharacteristicValueOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  abstract setMtu(mtu: number): Observable<WechatMiniprogram.SetBLEMTUSuccessCallbackResult>
  abstract getMtu(): Observable<WechatMiniprogram.GetBLEMTUSuccessCallbackResult>
  abstract notifyCharacteristicValueChange(options: Omit<WechatMiniprogram.NotifyBLECharacteristicValueChangeOption, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>
  abstract writeCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.WriteBLECharacteristicValueOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  private genericAccessOf(uuid: BlueToothGenericAccessCharacteristicUUIDs) {
    return this.getCharacteristics({ serviceId: GENERIC_ACCESS_SERVICE_UUID }).pipe(
      switchMap(() => this.readCharacteristicValue({
        serviceId: GENERIC_ACCESS_SERVICE_UUID,
        characteristicId: uuid
      })),
      switchMap(() => this.characteristicValueChange),
      filter(o => o.serviceId === GENERIC_ACCESS_SERVICE_UUID && o.characteristicId === uuid),
      map(({ value }) => {
        const hex = arrayBufferToHex(value);
        const ascii = hexToAscii(hex);
        return ascii.replace(EMPTY_HEX_REGEX, '');
      }),
      take(1),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private deviceInfoOf(uuid: BlueToothDeviceInfoCharacteristicUUIDs) {
    return this.getCharacteristics({ serviceId: DEVICE_INFO_SERVICE_UUID }).pipe(
      switchMap(() => this.readCharacteristicValue({
        serviceId: DEVICE_INFO_SERVICE_UUID,
        characteristicId: uuid
      })),
      switchMap(() => this.characteristicValueChange),
      filter(o => o.serviceId === DEVICE_INFO_SERVICE_UUID && o.characteristicId === uuid),
      map(({ value }) => {
        const hex = arrayBufferToHex(value);
        const ascii = hexToAscii(hex);
        return ascii.replace(EMPTY_HEX_REGEX, '');
      }),
      take(1),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * 向 BLE 特征值中写入二进制数据，支持分批发送。
   * @param value
   * @param options
   */
  writeCharacteristicValueInBatches(value: number[], options: Omit<PickProperty<WechatMiniprogram.WriteBLECharacteristicValueOption>, 'value' | 'deviceId'>) {
    // 小程序中 MTU 为 ATT_MTU，包含 Op-Code 和 Attribute Handle 的长度
    // 实际可以传输的数据长度为 MTU - 3，MTU 默认为 23，所以实际可用的长度为 23-3=20
    return from(
      splitArray(value, this.mtu - 3).map(arr =>
        this.writeCharacteristicValue({
          value: new Uint8Array(arr).buffer,
          ...options
        })
      )
    ).pipe(
      concatAll()
    );
  }
}
