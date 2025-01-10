import { type CharacteristicValue, type PlatformAccessory, type Service } from 'homebridge';
import { getActualDoorStatus, unlockDoor } from './httpClient.js';
import type { AndrewFrontDoorLockHomebridgePlatform } from './platform.js';

export class AndrewFrontDoorLockHomebridgePlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: AndrewFrontDoorLockHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // Get or create the LockMechanism service
    this.service = this.accessory.getService(this.platform.Service.LockMechanism)
      || this.accessory.addService(this.platform.Service.LockMechanism);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // Register handlers for LockCurrentState
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getCurrentState.bind(this));

    // Register handlers for LockTargetState
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));

    // Start polling for the lock state every 500ms
    this.startPolling();
  }

  /**
   * Start polling the lock state every 500ms.
   */
  private startPolling(): void {
    const pollInterval = 500;

    const pollState = async (): Promise<void> => {
      try {
        const status = await this.getCurrentState();
        console.log(`[${new Date().toISOString()}] | POLL | Status is ${status}`);

        // Update both target and current state
        this.service.updateCharacteristic(this.platform.Characteristic.LockTargetState, status);
        this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, status);

        // Schedule the next poll
        setTimeout(pollState, pollInterval);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${new Date().toISOString()}] | POLL | Failed to poll: ${errorMessage}`);
      }
    };

    pollState();
  }

  /**
   * Get the current state of the lock.
   */
  async getCurrentState(): Promise<CharacteristicValue> {
    try {
      console.log(`[${new Date().toISOString()}] | MAIN | Getting current state.`);
      const status = await getActualDoorStatus();
      console.log(`[${new Date().toISOString()}] | MAIN | Current state is ${status}`);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${new Date().toISOString()}] | MAIN | Failed to get current state: ${errorMessage}`);
      throw new Error(`[${new Date().toISOString()}] | MAIN | Failed to get current state: ${errorMessage}`);
    }
  }

  /**
   * Update the current state of the lock.
   */
  async setCurrentState(value: CharacteristicValue): Promise<void> {
    console.log(`[${new Date().toISOString()}] | MAIN | Setting current state to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.LockCurrentState, value);
  }

  /**
   * Get the target state of the lock.
   */
  async getTargetState(): Promise<CharacteristicValue> {
  // HomeKit already tracks the target state, no need for an instance variable
    return this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).value as CharacteristicValue;
  }

  /**
   * Set the target state of the lock.
   */
  async setTargetState(value: CharacteristicValue): Promise<void> {
    if (value === this.platform.Characteristic.LockTargetState.UNSECURED) {
      console.log(`[${new Date().toISOString()}] | MAIN | Unlocking the door.`);
      try {
        await unlockDoor();
        console.log(`[${new Date().toISOString()}] | MAIN | Door unlocked successfully.`);

        // Update the current state to Unlocked
        await this.setCurrentState(this.platform.Characteristic.LockCurrentState.UNSECURED);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${new Date().toISOString()}] | MAIN | Failed to unlock the door: ${errorMessage}`);
      }
    } else if (value === this.platform.Characteristic.LockTargetState.SECURED) {
      console.log(`[${new Date().toISOString()}] | MAIN | Locking the door.`);
      // Update the current state to Locked
      await this.setCurrentState(this.platform.Characteristic.LockCurrentState.SECURED);
    }
  }
}