import { Characteristic, type CharacteristicValue, type PlatformAccessory, type Service } from 'homebridge';

import { HttpClient } from './httpClient.js';
import type { AndrewFrontDoorLockHomebridgePlatform } from './platform.js';


export class AndrewFrontDoorLockHomebridgePlatformAccessory {
  private service: Service;
  private httpClient: HttpClient;

  constructor(
    private readonly platform: AndrewFrontDoorLockHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getLockState.bind(this)); // SET - bind to the `setOn` method below

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.getLockState.bind(this)) 
      .onSet(this.unlockDoor.bind(this));

    this.httpClient = new HttpClient('http://10.0.0.138:5000');
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async getLockState(): Promise<CharacteristicValue> {
    try {
      const serverResp = await this.httpClient.get<{ unlocked: boolean }>('/get_status');
      console.log(`Door status: ${serverResp.unlocked ? 'Unlocked' : 'Locked'}`);
      const status = serverResp.unlocked ? this.platform.Characteristic.LockCurrentState.UNSECURED : this.platform.Characteristic.LockCurrentState.SECURED;
      return status;
    } catch (error) {
      if (error instanceof Error) {
        // Now TypeScript knows `error` is an instance of `Error`
        console.error(error.message);
        const status = this.platform.Characteristic.LockCurrentState.UNKNOWN;
        return status;
      } else {
        console.error('Unknown error:', error);
        const status = this.platform.Characteristic.LockCurrentState.UNKNOWN;
        return status;
      }
    }
  }

  async unlockDoor(value: CharacteristicValue) {
    try {
      await this.httpClient.get<{ unlocked: boolean }>('/unlock');
      console.log('Door unlocked');
    } catch (error) {
      if (error instanceof Error) {
        // Now TypeScript knows `error` is an instance of `Error`
        console.error(error.message);
      } else {
        console.error('Unknown error:', error);
      }
    }
  }
}
