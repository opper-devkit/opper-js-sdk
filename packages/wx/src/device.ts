import { PickProperty } from '@ngify/core';
import { AbstractBluetoothLowEnergeyDevice, BluetoothLowEnergeCharacteristicValue, DEFAULT_MTU } from '@opper/core';
import { Observable, catchError, defer, map, share, shareReplay, switchMap, tap, timer } from 'rxjs';

export class BluetoothLowEnergeyDevice extends AbstractBluetoothLowEnergeyDevice {
  readonly characteristicValueChange = new Observable<BluetoothLowEnergeCharacteristicValue>(observer => {
    wx.onBLECharacteristicValueChange(result => result.deviceId === this.id && observer.next(result));
  }).pipe(
    share()
  );

  /** 连接状态变更 */
  readonly connectedChange = new Observable<boolean>(observer => {
    const next: WechatMiniprogram.OnBLEConnectionStateChangeCallback = result => result.deviceId === this.id && observer.next(result.connected);

    wx.onBLEConnectionStateChange(next);

    return () => wx.offBLEConnectionStateChange(next);
  }).pipe(
    share()
  );

  /** Received Signal Strength Indication */
  readonly rssiChange = timer(0, 1000).pipe(
    switchMap(() => wx.getBLEDeviceRSSI({ deviceId: this.id })),
    map(o => o.RSSI),
    share()
  );

  /**
   * 获取已连接设备的服务
   */
  readonly services = defer(() =>
    wx.getBLEDeviceServices({ deviceId: this.id })
  ).pipe(
    map(o => o.services),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly name = this.services.pipe(
    switchMap(services => wx.getConnectedBluetoothDevices({
      services: services
        .filter(service => service.isPrimary)
        .map(service => service.uuid.slice(4, 8)) // 去掉前面的0000，0000180A-0000-1000-8000-00805F9B34FB => 180A
    })),
    map(o => o.devices.find(o => o.deviceId === this.id)?.name || ''),
  );

  private reset() {
    this.mtu = DEFAULT_MTU;
  }

  /**
   * 创建 BLE 连接
   * @param options
   */
  connect(options?: Omit<PickProperty<WechatMiniprogram.CreateBLEConnectionOption>, 'deviceId'>) {
    return defer(() =>
      wx.createBLEConnection({ deviceId: this.id, ...options })
    ).pipe(
      switchMap(() => this.exchangeMtu()),
      catchError(error =>
        this.disconnect().pipe( // 即使连接失败，也需要主动断开
          catchError(() => { throw error; }),
          switchMap(() => { throw error; }),
        )
      ),
    );
  }

  /**
   * 关闭 BLE 连接
   * @param options
   */
  disconnect() {
    return defer(() =>
      wx.closeBLEConnection({ deviceId: this.id })
    ).pipe(
      tap(() => this.reset())
    );
  }

  /**
   * 获取设别的特征
   * 在 iOS 中，使用 getDeviceCharacteristics 之前必须先调用 getDeviceServices
   * @param options
   */
  getCharacteristics(options: Omit<PickProperty<WechatMiniprogram.GetBLEDeviceCharacteristicsOption>, 'deviceId'>) {
    return defer(() =>
      wx.getBLEDeviceCharacteristics({ deviceId: this.id, ...options })
    ).pipe(
      map(o => o.characteristics)
    );
  }

  /**
   * 读取特征值
   * 在 iOS 中，使用 readBLECharacteristicValue 之前必须先调用 getDeviceCharacteristics
   * @param options
   */
  readCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.ReadBLECharacteristicValueOption>, 'deviceId'>) {
    return defer(() =>
      wx.readBLECharacteristicValue({ deviceId: this.id, ...options })
    );
  }

  setMtu(mtu: number) {
    return defer(() => wx.setBLEMTU({ deviceId: this.id, mtu })).pipe(
      map(o => this.mtu = o.mtu)
    );
  }

  getMtu() {
    return defer(() => wx.getBLEMTU({ deviceId: this.id })).pipe(
      map(o => o.mtu)
    );
  }

  startNotifications(options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      wx.notifyBLECharacteristicValueChange({ deviceId: this.id, serviceId: options.serviceId, characteristicId: options.characteristicId, state: true })
    );
  }

  stopNotifications(options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      wx.notifyBLECharacteristicValueChange({ deviceId: this.id, serviceId: options.serviceId, characteristicId: options.characteristicId, state: false })
    );
  }

  /**
   * 向 BLE 特征值中写入二进制数据。
   * @param options
   */
  writeCharacteristicValue(value: ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      wx.writeBLECharacteristicValue({ deviceId: this.id, value: value, ...options })
    );
  }

}

/**
 * @deprecated Use {@link BluetoothLowEnergeyDevice} instead.
 */
export const BluetoothLowEnergeDevice = BluetoothLowEnergeyDevice;
