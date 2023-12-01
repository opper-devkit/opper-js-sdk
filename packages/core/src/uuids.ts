/** 通用访问服务 */
export const GENERIC_ACCESS_SERVICE_UUID = '00001800-0000-1000-8000-00805F9B34FB';
/** 设备信息服务 */
export const DEVICE_INFO_SERVICE_UUID = '0000180A-0000-1000-8000-00805F9B34FB';

/** 广播服务，固定的 */
export const ADVERTIS_SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
/** 可写特征 */
export const WRITE_CHARACTERISTIC_UUID = '0000FFE3-0000-1000-8000-00805F9B34FB';
/** 通知特征 */
export const NOTIFY_CHARACTERISTIC_UUID = '0000FFE4-0000-1000-8000-00805F9B34FB';

export const enum BlueToothGenericAccessCharacteristicUUIDs {
  /** 设备名 */
  DeviceName = '00002A00-0000-1000-8000-00805F9B34FB'
}

export const enum BlueToothDeviceInfoCharacteristicUUIDs {
  /** 产品型号特征 */
  ModelNumber = '00002A24-0000-1000-8000-00805F9B34FB',
  /** 序列号特征 */
  SerialNumber = '00002A25-0000-1000-8000-00805F9B34FB',
  /** 固件版本特征 */
  FirmwareRevision = '00002A26-0000-1000-8000-00805F9B34FB',
  /** 硬件版本特征 */
  HardwareRevision = '00002A27-0000-1000-8000-00805F9B34FB',
  /** 软件版本特征 */
  SoftwareRevision = '00002A28-0000-1000-8000-00805F9B34FB',
  /** 生产商名称特征 */
  ManufacturerName = '00002A29-0000-1000-8000-00805F9B34FB',
}
