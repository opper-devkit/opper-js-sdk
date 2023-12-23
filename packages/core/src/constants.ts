/** 低电阈值 */
export const LOW_BATTERY = 20;

/** 通用 */
export const ATT_CMD_PATTERN = /^ATT\+\w+=.+/;
/** ATT+WGT=-28,1721251,0|1    1代表稳定 */
export const ATT_WGT_PATTERN = /^ATT\+WGT=-?\d+,-?\d+,\d$/;
/** ATT+ACK=1 */
export const ATT_ACK_PATTERN = /^ATT\+ACK=[01]$/;
/** ATT+BAT=99,0 */
export const ATT_BAT_PATTERN = /^ATT\+BAT=\d{1,3},[01]$/;
/** ATT+IDLE=10 */
export const ATT_IDLE_PATTERN = /^ATT\+IDLE=\d+$/;
/** ATT+LOCK=10 */
export const ATT_LOCK_PATTERN = /^ATT\+LOCK=\d+$/;
/** ATT+ACCURACY=1000 */
export const ATT_ACCURACY_PATTERN = /^ATT\+ACCURACY=\d+$/;
/** ATT+AUTO_CLOSE=5 */
export const ATT_AUTO_CLOSE_PATTERN = /^ATT\+AUTO_CLOSE=\d+$/;
