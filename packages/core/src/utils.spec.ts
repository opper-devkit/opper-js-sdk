import { Attribute } from './attribute';
import {
  ATTRIBUTE_COMMAND_DELIMITER,
  arrayBufferToHex,
  chunkArray,
  chunkArrayBuffer,
  createAttributeCommand,
  createAttributeToken,
  hexToAscii,
  isArrayBuffer,
  isOpperDevice,
  parseAttributeCommand,
  stringToUint8Array,
  verifyAttributeCommand,
} from './utils';

describe('utils', () => {

  describe('createAttributeToken', () => {
    it('prefixes ATT+', () => {
      expect(createAttributeToken(Attribute.Acknowledge)).toBe('ATT+ACK');
    });
  });

  describe('createAttributeCommand', () => {
    it('appends delimiter and omits "=" when value is undefined', () => {
      expect(createAttributeCommand(Attribute.Reboot)).toBe(`ATT+RST${ATTRIBUTE_COMMAND_DELIMITER}`);
    });

    it('adds "=" when value is provided', () => {
      expect(createAttributeCommand(Attribute.Idle, 10)).toBe(`ATT+IDLE=10${ATTRIBUTE_COMMAND_DELIMITER}`);
    });

    it('joins array values with comma', () => {
      expect(createAttributeCommand(Attribute.Ref1, [100, 200])).toBe(`ATT+REF1=100,200${ATTRIBUTE_COMMAND_DELIMITER}`);
    });
  });

  describe('verifyAttributeCommand', () => {
    it('accepts known attribute formats (trimmed)', () => {
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Weight, [-1.23, 1721251, 1]).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Acknowledge, 0).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Battery, [99, 0]).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Idle, 10).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.AutoClose, 5).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Accuracy, 1.23).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Lock, 10.5).trim())).toBe(true);
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Filter, 20).trim())).toBe(true);

      // generic pattern
      expect(verifyAttributeCommand(createAttributeCommand(Attribute.Ref0, 123).trim())).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(verifyAttributeCommand('ATT+ACK=2')).toBe(false);
      expect(verifyAttributeCommand('ATT+WGT=-1.23,1721251')).toBe(false);
      expect(verifyAttributeCommand('ATT+BAT=1000,0')).toBe(false);
      expect(verifyAttributeCommand('ATT+IDLE=a')).toBe(false);
    });
  });

  describe('parseAttributeCommand', () => {
    it('parses attribute + values', () => {
      expect(parseAttributeCommand('ATT+ACK=1')).toEqual({
        attribute: Attribute.Acknowledge,
        value: ['1'],
      });

      expect(parseAttributeCommand('ATT+BAT=99,0')).toEqual({
        attribute: Attribute.Battery,
        value: ['99', '0'],
      });
    });
  });

  describe('isOpperDevice', () => {
    it('matches OPPER naming convention', () => {
      expect(isOpperDevice({ id: '1', name: 'OPPER-M12 ABCD' })).toBe(true);
      expect(isOpperDevice({ id: '2', name: 'OPPER-M0 1aZ_' })).toBe(true);
      expect(isOpperDevice({ id: '3', name: 'OPPER-M12ABCD' })).toBe(false);
      expect(isOpperDevice({ id: '4' })).toBe(false);
    });
  });

  describe('arrayBufferToHex + hexToAscii', () => {
    it('converts buffer to hex', () => {
      const buf = new Uint8Array([0, 15, 16, 255]).buffer;
      expect(arrayBufferToHex(buf)).toBe('000f10ff');
    });

    it('converts hex to ascii', () => {
      expect(hexToAscii('414243')).toBe('ABC');
      expect(hexToAscii('616263')).toBe('abc');
    });
  });

  describe('chunkArray', () => {
    it('chunks array-like into arrays', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunkArray(new Uint8Array([1, 2, 3, 4, 5]), 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('splitArrayBuffer', () => {
    it('splits into arraybuffers by length', () => {
      const buf = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const parts = chunkArrayBuffer(buf, 2);
      expect(parts.map(arrayBufferToHex)).toEqual(['0102', '0304', '05']);
    });
  });

  describe('isArrayBuffer', () => {
    it('detects ArrayBuffer', () => {
      expect(isArrayBuffer(new ArrayBuffer(0))).toBe(true);
      expect(isArrayBuffer(new Uint8Array(0))).toBe(false);
      expect(isArrayBuffer(null)).toBe(false);
      expect(isArrayBuffer({})).toBe(false);
    });
  });

  describe('stringToUint8Array', () => {
    it('converts ASCII string to bytes', () => {
      expect(Array.from(stringToUint8Array('ABC'))).toEqual([65, 66, 67]);
    });
  });
});
