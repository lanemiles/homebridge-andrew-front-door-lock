import axios from 'axios';

const BASE_URL = 'http://73.162.135.162:5000';
const UNLOCKED = 0;
const LOCKED = 1;

/**
 * Fetch the unlock status of the door.
 * @returns {Promise<boolean>} True if unlocked, false otherwise.
 * @throws {Error} If the request fails or the response is invalid.
 */
export async function getActualDoorStatus(): Promise<number> {
  try {
    console.log(`[${new Date().toISOString()}] | Calling /get_status`);
    const response = await axios.get(`${BASE_URL}/get_status`);
    
    // Validate response data structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response data');
    }

    const { unlocked } = response.data;
    const isUnlocked = unlocked === 'true';
    console.log(`[${new Date().toISOString()}] | Calling /get_status --> ${isUnlocked ? UNLOCKED : LOCKED}`);
    return isUnlocked ? UNLOCKED : LOCKED;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch unlock status: ${errorMessage}`);
    throw new Error(`Failed to fetch unlock status: ${errorMessage}`);
  }
}

/**
 * Unlock the door.
 * @returns {Promise<void>} Resolves if the operation is successful.
 * @throws {Error} If the request fails.
 */
export async function unlockDoor(): Promise<void> {
  try {
    console.log(`[${new Date().toISOString()}] | Calling /unlock`);
    await axios.get(`${BASE_URL}/unlock`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to unlock the door: ${errorMessage}`);
    throw new Error(`Failed to unlock the door: ${errorMessage}`);
  }
}