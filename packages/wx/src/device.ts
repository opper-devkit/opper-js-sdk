import { PickProperty } from '@ngify/types';
import { AbstractBluetoothLowEnergeDevice } from '@opper/core';
import { Observable, defer, filter, map, share, shareReplay, switchMap, takeUntil, tap, timer } from 'rxjs';

export class BluetoothLowEnergeDevice extends AbstractBluetoothLowEnergeDevice {
  readonly characteristicValueChange = new Observable<WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult>(observer => {
    wx.onBLECharacteristicValueChange(result => observer.next(result));

    return () => wx.offBLECharacteristicValueChange();
  }).pipe(
    filter(o => o.deviceId === this.id),
    share()
  );

  /** 连接状态变更 */
  readonly connectedChange = new Observable<WechatMiniprogram.OnBLEConnectionStateChangeListenerResult>(observer => {
    const next: WechatMiniprogram.OnBLEConnectionStateChangeCallback = result => observer.next(result);

    wx.onBLEConnectionStateChange(next);

    return () => wx.offBLEConnectionStateChange(next);
  }).pipe(
    filter(o => o.deviceId === this.id),
    map(o => o.connected),
    share()
  );

  /** Received Signal Strength Indication */
  readonly rssiChange = timer(0, 1000).pipe(
    switchMap(() => wx.getBLEDeviceRSSI({ deviceId: this.id })),
    map(o => o.RSSI)
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

  private reset() {
    this.mtu = 23;
  }

  /**
   * 创建 BLE 连接
   * @param options
   */
  connect(options?: Omit<PickProperty<WechatMiniprogram.CreateBLEConnectionOption>, 'deviceId'>) {
    this.destroy$.next();

    this.connectedChange.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.connected = value;
      value || this.destroy$.next();
    });

    return defer(() =>
      wx.createBLEConnection({ deviceId: this.id, ...options })
    );
  }

  /**
   * 关闭 BLE 连接
   * @param options
   */
  disconnect(options?: Omit<PickProperty<WechatMiniprogram.CloseBLEConnectionOption>, 'deviceId'>) {
    return defer(() =>
      wx.closeBLEConnection({ deviceId: this.id, ...options })
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
      tap(o => this.mtu = o.mtu)
    );
  }

  getMtu() {
    return defer(() => wx.getBLEMTU({ deviceId: this.id }));
  }

  /**
   * 订阅特征值变化
   * @param options
   */
  notifyCharacteristicValueChange(options: Omit<WechatMiniprogram.NotifyBLECharacteristicValueChangeOption, 'deviceId'>) {
    return defer(() =>
      wx.notifyBLECharacteristicValueChange({ deviceId: this.id, ...options })
    );
  }

  /**
   * 向 BLE 特征值中写入二进制数据。
   * @param options
   */
  writeCharacteristicValue(options: Omit<PickProperty<WechatMiniprogram.WriteBLECharacteristicValueOption>, 'deviceId'>) {
    return defer(() =>
      wx.writeBLECharacteristicValue({ deviceId: this.id, ...options })
    );
  }

}
