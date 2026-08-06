import { PickProperty } from '@ngify/core';
import { defer, map, Observable, share } from 'rxjs';

export class BluetoothService {
  /** 适配器状态变更 */
  readonly adapterStateChange = new Observable<UniApp.OnBluetoothAdapterStateChangeResult>(observer => {
    uni.onBluetoothAdapterStateChange(result => observer.next(result));

    return () => uni.offBluetoothAdapterStateChange();
  }).pipe(
    share()
  );

  /** 设备变更 */
  readonly devicesChange = new Observable<UniApp.BluetoothDeviceInfo[]>(observer => {
    uni.onBluetoothDeviceFound(result => observer.next(result.devices));

    return () => uni.offBluetoothDeviceFound();
  }).pipe(
    share()
  );

  devices() {
    return defer(() => uni.getBluetoothDevices()).pipe(
      map(o => o.devices)
    );
  }

  /**
   * 启动蓝牙适配器
   */
  openAdapter() {
    return defer(() => uni.openBluetoothAdapter());
  }

  /**
   * 关闭蓝牙适配器
   */
  closeAdapter() {
    return defer(() => uni.closeBluetoothAdapter());
  }

  /**
   * 开始设备搜寻
   * @param options
   */
  startDevicesDiscovery(options: PickProperty<UniNamespace.StartBluetoothDevicesDiscoveryOptions>) {
    return defer(() => uni.startBluetoothDevicesDiscovery({ powerLevel: 'high', ...options }));
  }

  /**
   * 停止设备搜寻
   */
  stopDevicesDiscovery() {
    return defer(() => uni.stopBluetoothDevicesDiscovery());
  }
}
