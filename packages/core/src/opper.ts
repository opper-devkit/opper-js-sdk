import { BehaviorSubject, Subject, TimeoutError, catchError, defer, filter, from, map, merge, of, retry, scan, share, shareReplay, switchMap, take, takeUntil, tap, throwError, timeout } from 'rxjs';
import { Attribute } from './attribute';
import { config } from './config';
import { AbstractBluetoothLowEnergeDevice } from './device';
import { AttributeCommandParser, DefaultAttributeCommandParser } from './parser';
import { ATTRIBUTE_COMMAND_DELIMITER, arrayBufferToHex, createAttributeCommand, hexToAscii, parseAttributeCommand, stringToUint8Array, verifyAttributeCommand } from './utils';
import { ADVERTIS_SERVICE_UUID, NOTIFY_CHARACTERISTIC_UUID, WRITE_CHARACTERISTIC_UUID } from './uuids';

export class Opper {
  private readonly destroy$: Subject<void> = new Subject();

  private readonly attributeCommandChange = defer(() =>
    this.connected.pipe(
      filter(Boolean),
      switchMap(() => this.device!.characteristicValueChange),
    )
  ).pipe(
    filter(o => o.serviceId === ADVERTIS_SERVICE_UUID && o.characteristicId === NOTIFY_CHARACTERISTIC_UUID),
    map(({ value }) => hexToAscii(arrayBufferToHex(value))),
    source => {
      let cmds: string[] = [];

      return source.pipe(
        scan((acc, cur) => {
          if (typeof config.debug === 'object' && config.debug.raw) {
            console.log(cur);
          }

          // 把上一次剩余的和当前的拼接起来
          acc += cur;

          // 如果包含分隔符，意味着其中会有一条以上的完整指令
          if (acc.includes(ATTRIBUTE_COMMAND_DELIMITER)) {
            cmds = acc.split(ATTRIBUTE_COMMAND_DELIMITER).filter(Boolean);
            // 如果最后不是以分隔符结尾的，说明最后一条不是完整的指令，把它拿出来，放到下一次
            const last = acc.endsWith(ATTRIBUTE_COMMAND_DELIMITER) ? '' : cmds.pop() || '';

            return last;
          }

          return acc;
        }),
        switchMap(() => from(cmds.splice(0, cmds.length))),
      );
    },
    filter(verifyAttributeCommand),
    tap(o => config.debug === true && console.log('⬇︎', o)),
    map(parseAttributeCommand),
    share(),
  );

  private readonly rawWeightChange = this.attributeCommandChange.pipe(
    filter(o => o.attribute === Attribute.Wight),
    share()
  );

  device?: AbstractBluetoothLowEnergeDevice;

  /** 当前连接状态 */
  readonly connected = new BehaviorSubject(false);
  readonly parser = new BehaviorSubject<AttributeCommandParser>(new DefaultAttributeCommandParser());

  readonly weightChange = this.parser.pipe(
    switchMap(parser => this.rawWeightChange.pipe(
      source => parser.weight(source),
    )),
    share()
  );

  readonly stableWeightChange = this.parser.pipe(
    switchMap(parser => this.rawWeightChange.pipe(
      source => parser.stableWeight(source),
    )),
    share()
  );

  readonly unstableWeightChange = this.parser.pipe(
    switchMap(parser => this.rawWeightChange.pipe(
      source => parser.unstableWeight(source),
    )),
    share()
  );

  readonly sampleChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Wight),
    map(cmd => +cmd.value[1]),
    shareReplay(1)
  );

  readonly batteryChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Battery),
    map(cmd => cmd.value.map(Number) as [number, number]),
    shareReplay(1)
  );

  readonly idleChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Idle),
    map(cmd => +cmd.value[0]),
    shareReplay(1)
  );

  readonly accuracyChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Accuracy),
    map(cmd => +cmd.value[0]),
    shareReplay(1)
  );

  readonly lockChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Lock),
    map(cmd => +cmd.value[0]),
    shareReplay(1)
  );

  readonly filterChange = this.attributeCommandChange.pipe(
    filter(cmd => cmd.attribute === Attribute.Filter),
    map(cmd => +cmd.value[0]),
    shareReplay(1)
  );

  readonly eventChanges = merge(
    this.attributeCommandChange.pipe(
      filter(cmd => cmd.attribute === Attribute.AutoClose)
    )
  ).pipe(
    share()
  );

  setParser(parser: AttributeCommandParser) {
    this.parser.next(parser);
  }

  check() {
    return this.emit(Attribute.Check);
  }

  /**
   * 校准
   * @param zeroSampleValue 归零时的采样值
   * @param correctionValue 单位/克
   */
  calibrate(zeroSampleValue: number, calibrationValue: number) {
    return this.emit(Attribute.Ref0, zeroSampleValue).pipe(
      switchMap(() => this.sampleChange),
      timeout(3000),
      take(1),
      switchMap((value: number) =>
        this.emit(Attribute.Ref1, [value, calibrationValue])
      )
    );
  }

  setIdle(value: number) {
    return this.emit(Attribute.Idle, value);
  }

  setAccuracy(value: number) {
    return this.emit(Attribute.Accuracy, value);
  }

  setLock(value: number) {
    return this.emit(Attribute.Lock, value);
  }

  setFilter(value: number) {
    return this.emit(Attribute.Filter, value);
  }

  shutdown() {
    return this.emit(Attribute.Close);
  }

  reboot() {
    return this.emit(Attribute.Reboot);
  }

  factory() {
    return this.emit(Attribute.Factory);
  }

  emit(att: Attribute, value?: string | number | (string | number)[]) {
    const attCmd = createAttributeCommand(att, value);
    const array = Array.from(stringToUint8Array(attCmd));

    return this.device!.writeCharacteristicValueInBatches(array, {
      serviceId: ADVERTIS_SERVICE_UUID,
      characteristicId: WRITE_CHARACTERISTIC_UUID
    }).pipe(
      tap(() => config.debug === true && console.log('⬆︎', attCmd)),
      switchMap(() => this.attributeCommandChange),
      filter(o => o.attribute === Attribute.Acknowledge),
      timeout(3000),
      take(1),
      map(o => {
        if (o.value[0] === '1') throw o;
        return o;
      }),
      retry(1),
      catchError(error => {
        if (config.debug === true) {
          if (error instanceof TimeoutError) {
            console.warn('timeout', attCmd);
          } else {
            console.error('error', attCmd);
          }
        }
        throw error;
      })
    );
  }

  connect(device: AbstractBluetoothLowEnergeDevice) {
    this.destroy$.next();

    this.device = device;

    device.connectedChange.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.connected.next(value);
      value || this.destroy$.next();
    });

    return device.connect().pipe(
      catchError(error => {
        switch (error.errCode) {
          case -1: // already connect
            return of(null);

          case 10003: // connection fail
            return device.disconnect().pipe( // 即使连接失败，也需要主动断开
              switchMap(() => throwError(() => error)),
              catchError(() => throwError(() => error)),
            );
        }

        throw error;
      }),
      // 在 iOS 中，使用 getDeviceCharacteristics 之前必须先调用 getDeviceServices，否则会失败
      switchMap(() => device.services),
      switchMap(() => device.getCharacteristics({ serviceId: ADVERTIS_SERVICE_UUID })),
      // retry(1),
      tap(() => {
        // TODO 247 to constant
        device.setMtu(247).pipe(
          catchError(() => of(null)), // 仅部分安卓支持 setMTU，所以这里失败也没关系
          switchMap(() => device.notifyCharacteristicValueChange({
            state: true,
            serviceId: ADVERTIS_SERVICE_UUID,
            characteristicId: NOTIFY_CHARACTERISTIC_UUID
          })),
          // 等待接收到 notify 的时候再开始 check
          switchMap(() => device.characteristicValueChange),
          take(1),
          switchMap(() => merge(
            // 率先订阅一遍，缓存起来
            // TODO BUG：accuracy 更新了，这些缓存没更新
            this.batteryChange.pipe(take(1)),
            this.accuracyChange.pipe(take(1)),
            this.lockChange.pipe(take(1)),
            this.idleChange.pipe(take(1)),
            this.filterChange.pipe(take(1)),
            this.check()
          )),
          takeUntil(this.destroy$)
        ).subscribe();
      }),
      takeUntil(this.destroy$)
    );
  }

  disconnect() {
    return this.device!.disconnect();
  }

}
