import { BehaviorSubject, Observable, Subject, TimeoutError, firstValueFrom, of, take, timeout, toArray } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Attribute, AttributeCommand } from './attribute';
import { AbstractBluetoothLowEnergeyDevice } from './device';
import { Opper } from './opper';
import type { BluetoothLowEnergeyCharacteristic, BluetoothLowEnergeyCharacteristicValue, BluetoothLowEnergeyService } from './typing';
import { createAttributeCommand, stringToUint8Array } from './utils';
import { ADVERTIS_SERVICE_UUID, NOTIFY_CHARACTERISTIC_UUID } from './uuids';

class TestDevice extends AbstractBluetoothLowEnergeyDevice {
  private readonly characteristicValueChangeSubject = new Subject<BluetoothLowEnergeyCharacteristicValue>();
  private readonly connectedChangeSubject = new BehaviorSubject(false);

  readonly characteristicValueChange: Observable<BluetoothLowEnergeyCharacteristicValue> = this.characteristicValueChangeSubject.asObservable();
  readonly connectedChange: Observable<boolean> = this.connectedChangeSubject.asObservable();
  readonly rssiChange: Observable<number> = of(-60);
  readonly services: Observable<BluetoothLowEnergeyService[]> = of([]);
  readonly name: Observable<string> = of('OPPER-M1 TEST');

  connect() {
    this.connectedChangeSubject.next(true);
    return of(true);
  }

  disconnect() {
    this.connectedChangeSubject.next(false);
    return of(true);
  }

  getCharacteristics(_options: { serviceId: string }) {
    const characteristics: BluetoothLowEnergeyCharacteristic[] = [];
    return of(characteristics);
  }

  readCharacteristicValue(_options: { serviceId: string; characteristicId: string }) {
    return of(new ArrayBuffer(0));
  }

  setMtu(mtu: number) {
    return of(this.mtu = mtu);
  }

  getMtu() {
    return of(this.mtu);
  }

  startNotifications(_options: { serviceId: string; characteristicId: string }) {
    return of(true);
  }

  stopNotifications(_options: { serviceId: string; characteristicId: string }) {
    return of(true);
  }

  writeCharacteristicValue(_value: ArrayBuffer, _options: { serviceId: string; characteristicId: string }) {
    return of(true);
  }

  pushNotify(chunk: string, options?: { serviceId?: string; characteristicId?: string }) {
    const value = stringToUint8Array(chunk).buffer;

    this.characteristicValueChangeSubject.next({
      serviceId: options?.serviceId ?? ADVERTIS_SERVICE_UUID,
      characteristicId: options?.characteristicId ?? NOTIFY_CHARACTERISTIC_UUID,
      value,
    });
  }
}

function getAttributeCommandChange(opper: Opper) {
  return (opper as unknown as { attributeCommandChange: Observable<AttributeCommand> }).attributeCommandChange;
}

describe('Opper', () => {
  let opper: Opper;
  let device: TestDevice;

  beforeEach(() => {
    opper = new Opper();
    device = new TestDevice('mock');
  })

  describe('attributeCommandChange', () => {
    it('parses a complete command from a single notify', async () => {
      await firstValueFrom(opper.connect(device));

      const attributeCommandChange = getAttributeCommandChange(opper);
      const resultPromise = firstValueFrom(attributeCommandChange.pipe(take(1)));

      device.pushNotify(createAttributeCommand(Attribute.Acknowledge, 1));

      await expect(resultPromise).resolves.toEqual({
        attribute: Attribute.Acknowledge,
        value: ['1'],
      });
    });

    it('handles fragmented and multiple commands across notifies', async () => {
      await firstValueFrom(opper.connect(device));

      const attributeCommandChange = getAttributeCommandChange(opper);
      const resultPromise = firstValueFrom(attributeCommandChange.pipe(take(2), toArray()));

      device.pushNotify('ATT+BAT=99');
      device.pushNotify(',0\r\nATT+ACK=1\r\n');

      await expect(resultPromise).resolves.toEqual([
        { attribute: Attribute.Battery, value: ['99', '0'] },
        { attribute: Attribute.Acknowledge, value: ['1'] },
      ]);
    });

    it('ignores non-notify characteristic and times out', async () => {
      await firstValueFrom(opper.connect(device));

      const attributeCommandChange = getAttributeCommandChange(opper);
      const resultPromise = firstValueFrom(attributeCommandChange.pipe(take(1), timeout(50)));

      device.pushNotify(createAttributeCommand(Attribute.Acknowledge, 1), {
        serviceId: 'wrong-service',
      });

      await expect(resultPromise).rejects.toBeInstanceOf(TimeoutError);
    });
  })
});
