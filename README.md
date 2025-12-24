# opper-js-sdk

Opper SDK for JavaScript/TypeScript.

![CI](https://github.com/opper-devkit/opper-js-sdk/workflows/Node.js%20CI/badge.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
[![CodeFactor](https://www.codefactor.io/repository/github/opper-devkit/opper-js-sdk/badge)](https://www.codefactor.io/repository/github/opper-devkit/opper-js-sdk)

## Packages

| Package                                                                                         | Intro             | Version                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`@opper/core`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/core)           | Opper core        | [![version](https://img.shields.io/npm/v/@opper/core/latest.svg)](https://www.npmjs.com/package/@opper/core)           |
| [`@opper/wx`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/wx)               | WeChat adapter    | [![version](https://img.shields.io/npm/v/@opper/wx/latest.svg)](https://www.npmjs.com/package/@opper/wx)               |
| [`@opper/capacitor`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/capacitor) | Capacitor adapter | [![version](https://img.shields.io/npm/v/@opper/capacitor/latest.svg)](https://www.npmjs.com/package/@opper/capacitor) |

&nbsp; ☝️ Click the links above to view the README for each package.

## Prerequisites

- [Bluetooth Low Energy](https://wikipedia.org/wiki/Bluetooth_Low_Energy).
- [RxJS](https://rxjs.dev/guide/overview) Observable techniques and operators.

## Install

Choose the Opper adapter that's right for your needs.

```bash
npm install @opper/core
# If you're developing a WeChat app
npm install @opper/wx
# If you're developing a Capacitor app
npm install @opper/capacitor
```

If you're developing a [Uni-app](https://uniapp.dcloud.io), or [Taro](https://docs.taro.zone) app, we don't currently provide an official adapter package.
But you can refer to [`@opper/wx`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/wx) for your own implementation, and feel free to contribute PR ：）

## API

For the full API definition, please visit [https://opper-devkit.github.io/opper-js-sdk](https://opper-devkit.github.io/opper-js-sdk).

## Example

```ts
import { isOpperDevice, Opper } from '@opper/core';
import { BluetoothLowEnergeyDevice, BluetoothService } from '@opper/wx';
import { finalize, map, switchMap } from 'rxjs';

const bluetoothService = new BluetoothService();

// Search for low-power Bluetooth devices
bluetoothService.openAdapter().pipe(
  switchMap(() =>
    bluetoothService.startDevicesDiscovery({
      allowDuplicatesKey: true
    })
  ),
  switchMap(() => bluetoothService.devicesChange),
  map(devices => devices.filter(device => isOpperDevice(device))),
  finalize(() => {
    bluetoothService.stopDevicesDiscovery().subscribe();
  })
).subscribe(devices => {
  // Self-collection of searched equipment
});

// Create an Opper instance
const opper = new Opper();
// Create a BLE device
const device = new BluetoothLowEnergeyDevice('deviceId');
// Connect to the device
opper.connect(device).subscribe();

// Subscribe to weight changes
opper.weightChange.subscribe(weight => {
  console.log(`New weight: ${weight}`);
});
// Subscribe to battery level and status changes
opper.batteryChange.subscribe(([battery, status]) => {
  console.log(`New battery level: ${battery}, Status: ${status}`);
});
// ...
```

## Migration

### v0.7.0

- Renamed `AbstractBluetoothLowEnergeDevice` to `AbstractBluetoothLowEnergeyDevice`.
- Renamed `BluetoothLowEnergeDevice` to `BluetoothLowEnergeyDevice`.
