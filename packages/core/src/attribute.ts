export const enum Attribute {
  /**
   * 重量
   *
   * `ATT+WGT=[W,S,N]`
   *
   * - W：重量值，克
   * - S：采样值
   * - N：0表示不稳定，1表示稳定，2表示超重
   */
  Weight = 'WGT',
  /**
   * 设置归零的采样值
   *
   * `ATT+REF0=[S]`
   *
   * - S：采样值
   */
  Ref0 = 'REF0',
  /**
   * 设置校准的采样值
   *
   * `ATT+REF1=[S,W]`
   *
   * - S：采样值
   * - W：砝码重量，克
   */
  Ref1 = 'REF1',
  /** 恢复出厂设置 */
  Factory = 'FACTORY',
  /**
   * 确认消息
   *
   * `ATT+ACK=[N]`
   *
   * - N：0 成功，1 失败，... 其他
   */
  Acknowledge = 'ACK',
  /** 检查信息 */
  Check = 'CHECK',
  /** 关机 */
  Close = 'CLOSE',
  /**
   * 终端通知上位机低电自动关机
   *
   * `ATT+AUTO_CLOSE=[T]`
   *
   * - T：秒数，表示T秒后自动关机
   */
  AutoClose = 'AUTO_CLOSE',
  /**
   * 空闲时间，默认10min
   *
   * `ATT+IDLE=[T]`
   *
   * - T：分钟，闲置T分钟后自动关机
   */
  Idle = 'IDLE',
  /**
   * 电池
   *
   * `ATT+BAT=[V,S]`
   *
   * - V：电池电量
   * - S：0表示未充电，1表示充电中
   */
  Battery = 'BAT',
  /**
   * 设置分度值，默认1g
   *
   * `ATT+ACCURACY=[G]`
   *
   * G：克
   */
  Accuracy = 'ACCURACY',
  /**
   * 稳定波动幅度，默认10g
   *
   * `ATT+LOCK=[G]`
   *
   * G: 克
   */
  Lock = 'LOCK',
  /**
   * 设置滤波器，默认40
   * Hz越大数值变化越快
   *
   * 0: 0.5Hz
   * 1: 0.35Hz
   * 2: 0.25Hz
   *
   * 10: 1Hz
   * 20: 2Hz
   * 40: 4Hz
   * 80: 8Hz
   */
  Filter = 'FILTER',
  /**
   * 重启设备
   */
  Reboot = 'RST'
}

export interface AttributeCommand {
  attribute: Attribute;
  value: string[];
}
