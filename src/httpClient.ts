import axios from 'axios';

export async function fetchUnlockStatus(): Promise<boolean> {
  try {
    const response = await axios.get('http://10.0.0.138:5000/get_status');

    // Ensure the response data is an object
    if (typeof response.data !== 'object' || response.data === null) {
      throw new Error('Response data is not an object');
    }

    // Extract and validate the "unlocked" key
    
    console.log(`D is ${response.data}`);
    console.log(`DU is ${response.data.unlocked}`);
    console.log(`typeof ${typeof response.data.unlocked}`);
    const { unlocked } = response.data.unlocked;
    const retVal = unlocked === 'true' ? true : false;
    console.log(`retValue ${retVal}`);
    return retVal;
  } catch (error) {
    if (error instanceof Error) {
    // Re-throw the error for the caller to handle
      console.log(`Failed to fetch unlock status: ${error.message}`);  
      throw new Error(`Failed to fetch unlock status: ${error.message}`);
    } else {
      console.log('OH NO');
      throw new Error('Failed bad error');
    }
  }
}

export async function unlockDoor(): Promise<void> {
  try {
    await axios.get('http://10.0.0.138:5000/unlock');
  } catch (error) {
    if (error instanceof Error) {
    // Re-throw the error for the caller to handle
      console.log(`Failed to fetch unlock status: ${error.message}`);  
      throw new Error(`Failed to fetch unlock status: ${error.message}`);
    } else {
      console.log('OH NO');
      throw new Error('Failed bad error');
    }
  }
}