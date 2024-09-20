export interface BluetoothLowEnergeService {
  uuid: string;
}

export interface BluetoothLowEnergeCharacteristic {
  uuid: string
  /** 该特征支持的操作类型 */
  properties: BluetoothLowEnergeCharacteristicProperties;
}

export interface BluetoothLowEnergeCharacteristicProperties {
  /** 该特征是否支持 indicate 操作 */
  indicate: boolean
  /** 该特征是否支持 notify 操作 */
  notify: boolean
  /** 该特征是否支持 read 操作 */
  read: boolean
  /** 该特征是否支持 write 操作 */
  write: boolean
  /** 该特征是否支持有回复写操作 */
  writeWithResponse?: boolean
  /** 该特征是否支持无回复写操作 */
  writeWithoutResponse?: boolean
}

export interface BluetoothLowEnergeCharacteristicValue {
  /** 蓝牙特征的 UUID */
  characteristicId: string
  /** 蓝牙特征对应服务的 UUID */
  serviceId: string
  /** 特征最新的值 */
  value: ArrayBuffer
}
