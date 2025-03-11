import { Attribute, AttributeCommand } from './attribute';
import { ATT_ACCURACY_PATTERN, ATT_ACK_PATTERN, ATT_AUTO_CLOSE_PATTERN, ATT_BAT_PATTERN, ATT_CMD_PATTERN, ATT_FILTER_PATTERN, ATT_IDLE_PATTERN, ATT_LOCK_PATTERN, ATT_WGT_PATTERN } from './constants';
import { BluetoothDevice } from './typing';

const ATTRIBUTE_TOKEN_PREFIX = 'ATT+' as const;
const OPPER_NAME_PATTERN = /^OPPER-M\d+\s\w{4}$/;

export const ATTRIBUTE_COMMAND_DELIMITER = '\r\n';

export function createAttributeToken(att: Attribute) {
  return (ATTRIBUTE_TOKEN_PREFIX + att) as `ATT+${Attribute}`;
}

export function createAttributeCommand(att: Attribute, value?: string | number | (string | number)[]) {
  const val = Array.isArray(value) ? value.join(',') : value;

  let cmd = createAttributeToken(att);

  if (val !== undefined) {
    cmd += `=${val}`;
  }

  return cmd + ATTRIBUTE_COMMAND_DELIMITER;
}

export function verifyAttributeCommand(cmd: string) {
  if (cmd.startsWith(createAttributeToken(Attribute.Weight))) {
    return ATT_WGT_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Acknowledge))) {
    return ATT_ACK_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Battery))) {
    return ATT_BAT_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Idle))) {
    return ATT_IDLE_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.AutoClose))) {
    return ATT_AUTO_CLOSE_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Accuracy))) {
    return ATT_ACCURACY_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Lock))) {
    return ATT_LOCK_PATTERN.test(cmd);
  }

  if (cmd.startsWith(createAttributeToken(Attribute.Filter))) {
    return ATT_FILTER_PATTERN.test(cmd);
  }

  return ATT_CMD_PATTERN.test(cmd);
}

export function parseAttributeCommand(cmd: string): AttributeCommand {
  const [token, value] = cmd.split('=');
  return {
    attribute: token.replace(/^ATT\+/, '') as Attribute,
    value: value.split(',')
  };
}

export function isOpperDevice(device: BluetoothDevice): boolean {
  return device.name ? OPPER_NAME_PATTERN.test(device.name) : false;
}

/**
 * 它接受一个 ArrayBuffer 并返回一个十六进制字符串。
 * @param {ArrayBuffer} buffer - 要转换为十六进制字符串的 ArrayBuffer。
 * @returns 字符串哈希的十六进制表示
 */
export function arrayBufferToHex(buffer: ArrayBufferLike) {
  const uint8Array = new Uint8Array(buffer);
  let hex = '';

  for (let i = 0; i < uint8Array.length; i++) {
    hex += uint8Array[i].toString(16).padStart(2, '0');
  }

  return hex;
}

/**
 * 它接受一串十六进制字符并将它们转换为 ASCII 字符
 * @param {string} hex - 要转换为 ASCII 的十六进制字符串
 * @returns 字符串
 */
export function hexToAscii(hex: string) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return str;
}

/**
 * 将数组按指定长度分割成子数组。
 *
 * @template T - 数组元素的类型。
 * @param arr - 要分割的数组。
 * @param length - 每个子数组的长度。
 * @returns 分割后的子数组。
 */
export function splitArray<T>(arr: ArrayLike<T>, length: number) {
  const tmp: T[][] = [];

  while (arr.length) {
    tmp.push(Array.from(arr).slice(0, length));
    arr = Array.from(arr).slice(length) as ArrayLike<T>;
  }

  return tmp;
}

/**
 * 将 ArrayBuffer 拆分为指定长度的子数组。
 *
 * @param buffer 要拆分的 ArrayBuffer。
 * @param length 子数组的长度。
 * @returns 拆分后的子数组。
 */
export function splitArrayBuffer(buffer: ArrayBuffer, length: number) {
  const tmp: ArrayBuffer[] = [];

  while (buffer.byteLength) {
    tmp.push(buffer.slice(0, length));
    buffer = buffer.slice(length);
  }

  return tmp;
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * 它接受一个字符串并返回一个 Uint8Array
 * @param {string} str - 要转换为字节数组的字符串
 * @returns 一个 Uint8Array。
 */
export function stringToUint8Array(str: string) {
  const arr = [] as number[];
  for (let i = 0; i < str.length; i++) {
    arr.push(str.charCodeAt(i));
  }
  return new Uint8Array(arr);
}
