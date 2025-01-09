import { Characteristic, type CharacteristicValue, type PlatformAccessory, type Service } from 'homebridge';
// import axios from 'axios';
// import { HttpClient } from './httpClient.js';
import axios from 'axios';
import { fetchUnlockStatus, unlockDoor } from './httpClient.js';
import type { AndrewFrontDoorLockHomebridgePlatform } from './platform.js';


export class AndrewFrontDoorLockHomebridgePlatformAccessory {
  private service: Service;
  // private httpClient: HttpClient;

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

    // this.httpClient = new HttpClient('http://10.0.0.138:5000');

    setInterval(() => {
      console.log('DOING OUR OWN GET!');
      const resp = axios.get('http://10.0.0.138:5000/get_status');
      resp.then(r => {
        if (typeof r.data !== 'object' || r.data === null) {
          throw new Error('Response data is not an object');
        }

        console.log(`OWN | D is ${r.data}`);
        console.log(`OWN | DU is ${r.data.unlocked}`);
        console.log(`OWN | typeof ${typeof r.data.unlocked}`);
        const { unlocked } = r.data.unlocked;
        const unlockedVal = unlocked === 'true' ? true : false;
        console.log(`retValue ${unlockedVal}`);

        if (unlockedVal === true) {
          console.log('UNLOCKED WAS TRUE');
          this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.UNSECURED);
          this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.platform.Characteristic.LockTargetState.UNSECURED);
        } else if (unlockedVal === false) {
          console.log('UNLOCKED WAS FALSE');
          this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.SECURED);
          this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.platform.Characteristic.LockTargetState.SECURED);
        }

        
      });
    }, 10000);
  
  }

  


  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async getLockState(): Promise<CharacteristicValue> {
    console.log(`[${new Date().toISOString()}] NEW GET LOCK STATE`);
    try {
      const resp = await fetchUnlockStatus();
      let status = this.platform.Characteristic.LockCurrentState.UNSECURED;
      if (resp === true) {
        console.log('UNLOCKED WAS TRUE');
        status = this.platform.Characteristic.LockCurrentState.UNSECURED;
      } else if (resp === false) {
        console.log('UNLOCKED WAS FALSE');
        status = this.platform.Characteristic.LockCurrentState.SECURED;
      }
      console.log(`Door status: ${status}`);
      return status;
    } catch (error) {
      if (error instanceof Error) {
        // Now TypeScript knows `error` is an instance of `Error`
        console.log(`ERROR ${error.message}`);
        const status = this.platform.Characteristic.LockCurrentState.UNKNOWN;
        return status;
      } else {
        console.log(`ERROR ${error}`);
        const status = this.platform.Characteristic.LockCurrentState.UNKNOWN;
        return status;
      }
    }
  }

  async unlockDoor(value: CharacteristicValue) {
    try {
      this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.platform.Characteristic.LockTargetState.UNSECURED);
      unlockDoor();
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockCurrentState.UNSECURED);
      this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, this.platform.Characteristic.LockTargetState.SECURED);
      this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, this.platform.Characteristic.LockCurrentState.SECURED);
      console.log('Door unlocked');
    } catch (error) {
      if (error instanceof Error) {
        // Now TypeScript knows `error` is an instance of `Error`
        console.log(`ERROR ${error.message}`);
      } else {
        console.log(`ERROR ${error}`);
      }
    }
  }
  
}
