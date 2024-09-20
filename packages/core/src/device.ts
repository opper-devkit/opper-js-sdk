import { AnyObject, SafeAny } from '@ngify/types';
import { Observable, concatAll, filter, from, last, map, shareReplay, switchMap, take } from 'rxjs';
import { DEFAULT_MTU } from './constants';
import { BluetoothLowEnergeCharacteristic, BluetoothLowEnergeCharacteristicValue, BluetoothLowEnergeService } from './typing';
import { arrayBufferToHex, hexToAscii, isArrayBuffer, splitArray, splitArrayBuffer } from './utils';
import { BlueToothDeviceInfoCharacteristicUUIDs, DEVICE_INFO_SERVICE_UUID } from './uuids';

// 空白字符（HEX: 00）
// eslint-disable-next-line no-control-regex
const EMPTY_HEX_REGEX = /\x00/g;

export abstract class AbstractBluetoothLowEnergeDevice {
  abstract readonly characteristicValueChange: Observable<BluetoothLowEnergeCharacteristicValue>
  abstract readonly connectedChange: Observable<boolean>;
  abstract readonly rssiChange: Observable<number>
  abstract readonly services: Observable<BluetoothLowEnergeService[]>;
  /** 设备名 */
  abstract readonly name: Observable<string>;

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

  protected mtu: number = DEFAULT_MTU;

  constructor(
    public readonly id: string
  ) { }

  abstract connect(options?: AnyObject): Observable<SafeAny>

  abstract disconnect(): Observable<boolean>;

  abstract getCharacteristics(options: { serviceId: string } & AnyObject): Observable<BluetoothLowEnergeCharacteristic[]>

  abstract readCharacteristicValue(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>

  abstract setMtu(mtu: number): Observable<number>
  abstract getMtu(): Observable<number>
  abstract startNotifications(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>;
  abstract stopNotifications(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>;

  abstract writeCharacteristicValue(value: ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>

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
  writeCharacteristicValueInBatches(value: ArrayLike<number> | ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject) {
    // ATT_MTU，包含 Op-Code 和 Attribute Handle 的长度
    // 实际可以传输的数据长度为 MTU - 3，MTU 默认为 23，所以实际可用的长度为 23-3=20

    const length = this.mtu - 3;
    const buffers = isArrayBuffer(value)
      ? splitArrayBuffer(value, length)
      : splitArray<number>(value, length).map(arr => new Uint8Array(arr).buffer);

    return from(
      buffers.map(value =>
        this.writeCharacteristicValue(value, options)
      )
    ).pipe(
      concatAll(),
      last()
    );
  }
}
