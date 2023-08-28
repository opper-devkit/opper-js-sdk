import { SafeAny } from '@ngify/types';
import { Attribute } from './attribute';
import { ATT_ACCURACY_PATTERN, ATT_ACK_PATTERN, ATT_AUTO_CLOSE_PATTERN, ATT_BAT_PATTERN, ATT_CMD_PATTERN, ATT_IDLE_PATTERN, ATT_WGT_PATTERN } from './constants';
import { AttributeCommand } from './interface';

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
  if (cmd.startsWith(createAttributeToken(Attribute.Wight))) {
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

  return ATT_CMD_PATTERN.test(cmd);
}

export function parseAttributeCommand(cmd: string): AttributeCommand {
  const [token, value] = cmd.split('=');
  return {
    attribute: token.replace(/^ATT\+/, '') as Attribute,
    value: token === createAttributeToken(Attribute.Raw) ? [value] : value.split(',')
  };
}

export function isOpperDevice(device: WechatMiniprogram.BlueToothDevice) {
  // 优先使用 name，因为 localName 是在客户端上可修改的，不可信
  return OPPER_NAME_PATTERN.test(device.name);
}

/**
 * 它接受一个 ArrayBuffer 并返回一个十六进制字符串。
 * @param {ArrayBuffer} buffer - 要转换为十六进制字符串的 ArrayBuffer。
 * @returns 字符串哈希的十六进制表示
 */
export function arrayBufferToHex(buffer: ArrayBuffer) {
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
 * splitArray 函数将数组拆分为指定长度的较小数组。
 * @param arr - `arr` 参数是任何类型的数组。
 * @param length - splitArray 函数中的 length 参数表示每个子数组所需的长度。它确定每个子数组中应包含原始数组中的多少元素。
 * @returns 函数“splitArray”返回一个数组的数组。每个内部数组都包含原始数组“arr”的一部分，其长度由“length”参数指定。
 */
export function splitArray<T extends SafeAny[]>(arr: T, length: number) {
  const tmp = [] as unknown as T;

  while (arr.length) {
    tmp.push(arr.slice(0, length));
    arr = arr.slice(length) as T;
  }

  return tmp;
}

/**
 * 它接受一个字符串并返回一个 Uint8Array
 * @param {string} str - 要转换为字节数组的字符串
 * @returns 一个 Uint8Array。
 */
export function stringToUint8Array(str: string) {
  let arr = [] as number[];
  for (let i = 0; i < str.length; i++) {
    arr.push(str.charCodeAt(i));
  }
  return new Uint8Array(arr);
}
