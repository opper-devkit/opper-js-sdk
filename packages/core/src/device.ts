import { AnyObject, SafeAny } from '@ngify/core';
import { Observable, catchError, combineLatest, concatAll, defer, filter, from, last, map, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { DEFAULT_MTU } from './constants';
import { BluetoothLowEnergeCharacteristic, BluetoothLowEnergeCharacteristicValue, BluetoothLowEnergeService } from './typing';
import { arrayBufferToHex, chunkArray, hexToAscii, isArrayBuffer, splitArrayBuffer } from './utils';
import { BlueToothDeviceInfoCharacteristicUUIDs, DEVICE_INFO_SERVICE_UUID } from './uuids';

// 空白字符（HEX: 00）
// eslint-disable-next-line no-control-regex
const EMPTY_HEX_REGEX = /\x00/g;

export abstract class AbstractBluetoothLowEnergeyDevice {
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

  abstract disconnect(): Observable<SafeAny>;

  abstract getCharacteristics(options: { serviceId: string } & AnyObject): Observable<BluetoothLowEnergeCharacteristic[]>

  abstract readCharacteristicValue(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>

  abstract setMtu(mtu: number): Observable<number>
  abstract getMtu(): Observable<number>
  abstract startNotifications(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>;
  abstract stopNotifications(options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>;

  abstract writeCharacteristicValue(value: ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject): Observable<SafeAny>

  private deviceInfoOf(uuid: BlueToothDeviceInfoCharacteristicUUIDs) {
    return defer(() => this.getCharacteristics({ serviceId: DEVICE_INFO_SERVICE_UUID })).pipe(
      switchMap(() => combineLatest([
        this.characteristicValueChange,
        this.readCharacteristicValue({
          serviceId: DEVICE_INFO_SERVICE_UUID,
          characteristicId: uuid
        })
      ])),
      map(([o]) => o),
      filter(o => o.serviceId === DEVICE_INFO_SERVICE_UUID && o.characteristicId === uuid),
      map(({ value }) => {
        const hex = arrayBufferToHex(value);
        const ascii = hexToAscii(hex);
        return ascii.replace(EMPTY_HEX_REGEX, '');
      }),
      take(1),
      shareReplay(1)
    );
  }

  /**
   * 向 BLE 特征值中写入二进制数据，支持分批发送。
   * @param value
   * @param options
   */
  writeCharacteristicValueInBatches(value: ArrayLike<number> | ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject) {
    // MTU	报头Header	最大发送量Payload	备注
    // 23	  3	         20 	            BLE 4.0 默认值
    // 185	3	         182 	            早期 iOS 常见协商值
    // 247	3	         244 	            许多 Android 手机与芯片的常用值（对齐 4 字节，效率高）
    // 517	5	         512 	            行业天花板。单包能传的最长特征值数据。

    // 为什么 517 的 Header 是 5？
    // Write Request（普通写入）需要报头 3 字节（Opcode + Handle）。
    // Prepare Write Request（可靠写入）需要多 2 个字节来表示偏移量 Offset。

    const length = Math.min(this.mtu - 3, 512); // 最大不超过 512 字节
    const buffers = isArrayBuffer(value)
      ? splitArrayBuffer(value, length)
      : chunkArray<number>(value, length).map(arr => new Uint8Array(arr).buffer);

    return from(
      buffers.map(value =>
        this.writeCharacteristicValue(value, options)
      )
    ).pipe(
      concatAll(),
      last()
    );
  }

  exchangeMtu() {
    // 23： 未协商的默认值
    // 185：iOS 设备上的常见协商结果
    // 247：很多外设、部分 Android/嵌入式栈的常见协商结果
    // 517：Android 侧 API 允许请求到的最大 ATT MTU
    return this.setMtu(517).pipe(
      catchError(() => this.setMtu(247)),
      catchError(() => this.setMtu(185)),
      // 最后尝试直接使用 getMtu 的值
      // 因为小程序的 setMtu 最大只支持 512，而部分设备的可协商结果是 517，大于 512 会导致 setMtu 失败
      // 但 getMtu 是可以获取 517 的
      catchError(() => this.getMtu().pipe(
        tap(mtu => this.mtu = mtu)
      )),
      catchError(() => {
        this.mtu = DEFAULT_MTU;
        return of(DEFAULT_MTU);
      })
    );
  }
}

/**
 * @deprecated Use {@link AbstractBluetoothLowEnergeyDevice} instead.
 */
export const AbstractBluetoothLowEnergeDevice = AbstractBluetoothLowEnergeyDevice;
