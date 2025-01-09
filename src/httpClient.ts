import axios, { AxiosInstance } from 'axios';

export class HttpClient {
  private client: AxiosInstance;

  constructor(private baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000, // Set a timeout (5 seconds)
    });
  }

  // Perform a GET request
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.data;
  }

  // Handle errors centrally
  async safeRequest<T>(request: Promise<T>): Promise<T | null> {
    try {
      return await request;
    } catch (error) {
      console.error(`HTTP Error: ${error}`);
      return null;
    }
  }
}