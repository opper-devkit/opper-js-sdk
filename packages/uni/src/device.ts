import { PickProperty, SafeAny } from '@ngify/core';
import { AbstractBluetoothLowEnergeyDevice, BluetoothLowEnergeyCharacteristicValue, DEFAULT_MTU } from '@opper/core';
import { Observable, catchError, defer, delay, filter, map, share, shareReplay, switchMap, take, tap, timer } from 'rxjs';

export class BluetoothLowEnergeyDevice extends AbstractBluetoothLowEnergeyDevice {
  readonly characteristicValueChange = new Observable<BluetoothLowEnergeyCharacteristicValue>(observer => {
    uni.onBLECharacteristicValueChange(result => result.deviceId === this.id && observer.next(result as unknown as BluetoothLowEnergeyCharacteristicValue));
  }).pipe(
    share()
  );

  /** 连接状态变更 */
  readonly connectedChange = new Observable<boolean>(observer => {
    const next: (result: UniApp.OnBLEConnectionStateChangeSuccess) => void = result => result.deviceId === this.id && observer.next(result.connected);

    uni.onBLEConnectionStateChange(next);

    return () => uni.offBLEConnectionStateChange(next);
  }).pipe(
    share()
  );

  /** Received Signal Strength Indication */
  readonly rssiChange = timer(0, 1000).pipe(
    switchMap(() => uni.getBLEDeviceRSSI({ deviceId: this.id })),
    map(o => o.RSSI),
    share()
  );

  /**
   * 获取已连接设备的服务
   */
  readonly services = defer(() =>
    uni.getBLEDeviceServices({ deviceId: this.id })
  ).pipe(
    map(o => o.services),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly name = this.services.pipe(
    switchMap(services => uni.getConnectedBluetoothDevices({
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
  connect(options?: Omit<PickProperty<UniNamespace.CreateBLEConnectionOptions>, 'deviceId'>) {
    return defer(() =>
      uni.createBLEConnection({ deviceId: this.id, ...options })
    ).pipe(
      delay(1),
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
      uni.closeBLEConnection({ deviceId: this.id })
    ).pipe(
      tap(() => this.reset())
    );
  }

  /**
   * 获取设别的特征
   * 在 iOS 中，使用 getDeviceCharacteristics 之前必须先调用 getDeviceServices
   * @param options
   */
  getCharacteristics(options: Omit<PickProperty<UniApp.GetBLEDeviceCharacteristicsOptions>, 'deviceId'>) {
    return defer(() =>
      uni.getBLEDeviceCharacteristics({ deviceId: this.id, ...options })
    ).pipe(
      map(o => o.characteristics)
    );
  }

  /**
   * 读取特征值
   * 在 iOS 中，使用 readBLECharacteristicValue 之前必须先调用 getDeviceCharacteristics
   * @param options
   */
  readCharacteristicValue(options: Omit<PickProperty<UniApp.ReadBLECharacteristicValueOptions>, 'deviceId'>) {
    return new Observable<ArrayBufferLike>(subscriber => {
      const { serviceId, characteristicId } = options;

      const sub = this.characteristicValueChange.pipe(
        filter(o => o.serviceId === serviceId && o.characteristicId === characteristicId),
        take(1),
        map(o => o.value)
      ).subscribe({
        next: value => {
          subscriber.next(value);
          subscriber.complete();
        },
        error: err => subscriber.error(err),
      });

      uni.readBLECharacteristicValue({ deviceId: this.id, ...options })
        .catch(err => subscriber.error(err));

      return () => sub.unsubscribe();
    });
  }

  setMtu(mtu: number) {
    return defer(() => uni.setBLEMTU({ deviceId: this.id, mtu })).pipe(
      map(o => this.mtu = o.mtu)
    );
  }

  getMtu() {
    return defer(() => uni.getBLEMTU({ deviceId: this.id }) as unknown as Promise<{ mtu: number }>).pipe(
      map(o => o.mtu)
    );
  }

  startNotifications(options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      uni.notifyBLECharacteristicValueChange({ deviceId: this.id, serviceId: options.serviceId, characteristicId: options.characteristicId, state: true })
    );
  }

  stopNotifications(options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      uni.notifyBLECharacteristicValueChange({ deviceId: this.id, serviceId: options.serviceId, characteristicId: options.characteristicId, state: false })
    );
  }

  /**
   * 向 BLE 特征值中写入二进制数据。
   * @param options
   */
  writeCharacteristicValue(value: ArrayBuffer, options: { serviceId: string, characteristicId: string } & AnyObject) {
    return defer(() =>
      uni.writeBLECharacteristicValue({ deviceId: this.id, value: value as unknown as SafeAny[], ...options })
    );
  }

}
