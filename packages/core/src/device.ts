import { PickProperty } from '@ngify/types';
import { Observable, concatAll, from } from 'rxjs';
import { splitArray } from './utils';

export abstract class AbstractBluetoothLowEnergeDevice {
  abstract readonly characteristicValueChange: Observable<WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult>
  abstract readonly connectionStateChange: Observable<WechatMiniprogram.OnBLEConnectionStateChangeListenerResult>

  abstract readonly modelNumber: Observable<string>
  abstract readonly serialNumber: Observable<string>
  abstract readonly firmwareRevision: Observable<string>
  abstract readonly hardwareRevision: Observable<string>
  abstract readonly softwareRevision: Observable<string>
  abstract readonly manufacturerName: Observable<string>
  abstract readonly services: Observable<WechatMiniprogram.BLEService[]>

  protected mtu: number = 23;

  protected set id(value) {
    this._id = value;
  }

  get id() {
    return this._id;
  }

  constructor(
    private _id: string
  ) { }

  abstract connect(options?: Omit<PickProperty<WechatMiniprogram.CreateBLEConnectionOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  abstract disconnect(options?: Omit<PickProperty<WechatMiniprogram.CloseBLEConnectionOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  abstract getCharacteristics(options: Omit<PickProperty<WechatMiniprogram.GetBLEDeviceCharacteristicsOption>, 'deviceId'>): Observable<WechatMiniprogram.BLECharacteristic[]>

  abstract readCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.ReadBLECharacteristicValueOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

  abstract setMtu(mtu: number): Observable<WechatMiniprogram.SetBLEMTUSuccessCallbackResult>
  abstract getMtu(): Observable<WechatMiniprogram.GetBLEMTUSuccessCallbackResult>
  abstract notifyCharacteristicValueChange(options: Omit<WechatMiniprogram.NotifyBLECharacteristicValueChangeOption, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>
  abstract writeCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.WriteBLECharacteristicValueOption>, 'deviceId'>): Observable<WechatMiniprogram.BluetoothError>

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
