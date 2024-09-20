# opper-js-sdk

Opper SDK for JavaScript/TypeScript.

![CI](https://github.com/opper-devkit/opper-js-sdk/workflows/Node.js%20CI/badge.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
[![CodeFactor](https://www.codefactor.io/repository/github/opper-devkit/opper-js-sdk/badge)](https://www.codefactor.io/repository/github/opper-devkit/opper-js-sdk)

## Packages

| Package                                                                                         | Intro             | Version                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`@opper/core`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/core)           | opper core        | [![version](https://img.shields.io/npm/v/@opper/core/latest.svg)](https://www.npmjs.com/package/@opper/core)           |
| [`@opper/wx`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/wx)               | wx adapter        | [![version](https://img.shields.io/npm/v/@opper/wx/latest.svg)](https://www.npmjs.com/package/@opper/wx)               |
| [`@opper/capacitor`](https://github.com/opper-devkit/opper-js-sdk/tree/main/packages/capacitor) | capacitor adapter | [![version](https://img.shields.io/npm/v/@opper/capacitor/latest.svg)](https://www.npmjs.com/package/@opper/capacitor) |

&nbsp; ☝️ Click the links above to view the README for each package.

## Prerequisites

- WeChat miniprogram Low Energy [Bluetooth](https://developers.weixin.qq.com/miniprogram/dev/framework/device/bluetooth.html) related technologies.
- [RxJS](https://rxjs.dev/guide/overview) Observable techniques and operators.

## API

For the full API definition, please visit [https://opper-devkit.github.io/opper-js-sdk](https://opper-devkit.github.io/opper-js-sdk).

## Example

```ts
import { isOpperDevice, Opper } from '@opper/core';
import { BluetoothLowEnergeDevice, BluetoothService } from '@opper/wx';
import { finalize, map, switchMap } from 'rxjs';

const bluetoothService = new BluetoothService();

// 搜寻蓝牙设备
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
  // 自行收集搜寻到的设备
});

// 创建一个 opper
const opper = new Opper();
// 创建一个 BLE 设备
const device = new BluetoothLowEnergeDevice('deviceId');
// 连接设备
opper.connect(device).subscribe();

// 订阅称重值
opper.weightChange.subscribe(/** callback */);
// 订阅电量
opper.batteryChange.subscribe(/** callback */);
// ...
```
