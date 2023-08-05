import { PickProperty } from '@ngify/types';
import { defer, map, Observable, share } from 'rxjs';

export class BluetoothService {
  /** 适配器状态变更 */
  readonly adapterStateChange = new Observable<WechatMiniprogram.OnBluetoothAdapterStateChangeListenerResult>(observer => {
    wx.onBluetoothAdapterStateChange(result => observer.next(result));

    return () => wx.offBluetoothAdapterStateChange();
  }).pipe(
    share()
  );

  /** 设备变更 */
  readonly devicesChange = new Observable<WechatMiniprogram.BlueToothDevice[]>(observer => {
    wx.onBluetoothDeviceFound(result => observer.next(result.devices));

    return () => wx.offBluetoothDeviceFound();
  }).pipe(
    share()
  );

  devices() {
    return defer(() => wx.getBluetoothDevices()).pipe(
      map(o => o.devices)
    );
  }

  /**
   * 启动蓝牙适配器
   */
  openAdapter() {
    return defer(() => wx.openBluetoothAdapter());
  }

  /**
   * 关闭蓝牙适配器
   */
  closeAdapter() {
    return defer(() => wx.closeBluetoothAdapter());
  }

  /**
   * 开始设备搜寻
   * @param options
   */
  startDevicesDiscovery(options: PickProperty<WechatMiniprogram.StartBluetoothDevicesDiscoveryOption>) {
    return defer(() => wx.startBluetoothDevicesDiscovery(options));
  }

  /**
   * 停止设备搜寻
   */
  stopDevicesDiscovery() {
    return defer(() => wx.stopBluetoothDevicesDiscovery());
  }
}
