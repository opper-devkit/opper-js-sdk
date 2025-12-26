import { BleClient } from '@capacitor-community/bluetooth-le';
import { AnyObject, SafeAny } from '@ngify/core';
import { AbstractBluetoothLowEnergeyDevice, BluetoothLowEnergeyCharacteristic, BluetoothLowEnergeyCharacteristicValue, DEFAULT_MTU } from '@opper/core';
import { Observable, Subject, defer, map, shareReplay, switchMap, tap, throwError, timer } from 'rxjs';

export class BluetoothLowEnergeyDevice extends AbstractBluetoothLowEnergeyDevice {
  characteristicValueChange = new Subject<BluetoothLowEnergeyCharacteristicValue>();
  connectedChange = new Subject<boolean>();
  rssiChange = timer(0, 1000).pipe(
    switchMap(() => BleClient.readRssi(this.id))
  );

  services = defer(() =>
    BleClient.getServices(this.id)
  ).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  name = this.services.pipe(
    switchMap(services => BleClient.getConnectedDevices(services.map(o => o.uuid))),
    map(devices => devices.find(device => device.deviceId === this.id)?.name || ''),
  );

  private reset() {
    this.mtu = DEFAULT_MTU;
  }

  connect(_options?: AnyObject): Observable<SafeAny> {
    return defer(() =>
      BleClient.connect(this.id, () => this.connectedChange.next(false))
    ).pipe(
      tap(() => this.connectedChange.next(true)),
      switchMap(() => this.exchangeMtu()),
    );
  }

  disconnect(): Observable<SafeAny> {
    return defer(() => BleClient.disconnect(this.id)).pipe(
      tap(() => this.reset())
    );
  }

  getCharacteristics(options: { serviceId: string; } & AnyObject): Observable<BluetoothLowEnergeyCharacteristic[]> {
    return this.services.pipe(
      map(services => services.find(o => o.uuid === options.serviceId)?.characteristics || [])
    );
  }

  readCharacteristicValue(options: { serviceId: string; characteristicId: string; } & AnyObject): Observable<ArrayBufferLike> {
    return defer(() => BleClient.read(this.id, options.serviceId, options.characteristicId)).pipe(
      map(value => value.buffer),
      tap(value => {
        this.characteristicValueChange.next({
          serviceId: options.serviceId,
          characteristicId: options.characteristicId,
          value,
        });
      })
    );
  }

  setMtu(_mtu: number): Observable<number> {
    // @capacitor-community/bluetooth-le not supported
    // https://github.com/capacitor-community/bluetooth-le/issues/541
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return throwError(() => { });
  }

  getMtu(): Observable<number> {
    return defer(() => BleClient.getMtu(this.id));
  }

  startNotifications(options: { serviceId: string; characteristicId: string; } & AnyObject): Observable<SafeAny> {
    return defer(() => BleClient.startNotifications(this.id, options.serviceId, options.characteristicId, value => {
      this.characteristicValueChange.next({
        serviceId: options.serviceId,
        characteristicId: options.characteristicId,
        value: value.buffer
      });
    }));
  }

  stopNotifications(options: { serviceId: string; characteristicId: string; } & AnyObject): Observable<SafeAny> {
    return defer(() => BleClient.stopNotifications(this.id, options.serviceId, options.characteristicId));
  }

  writeCharacteristicValue(value: ArrayBuffer, options: { serviceId: string; characteristicId: string; } & AnyObject): Observable<SafeAny> {
    return defer(() => BleClient.write(this.id, options.serviceId, options.characteristicId, new DataView(value)));
  }

}
