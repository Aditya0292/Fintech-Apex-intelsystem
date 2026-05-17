/**
 * Upstash Redis REST Client
 * Lightweight, fetch-based utility for high-frequency tactical data sync.
 */
export class RedisClient {
  private url: string;
  private token: string;

  constructor() {
    this.url = process.env.UPSTASH_REDIS_REST_URL || "";
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  }

  public get isActive() {
    return !!(this.url && this.token);
  }

  /**
   * Fetches the situational state from the primary tactical cache.
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isActive) return null;

    try {
      const resp = await fetch(`${this.url}/get/${key}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        next: { revalidate: 0 }, // Ensure fresh tactical data
      });

      if (!resp.ok) return null;
      const data = await resp.json();
      return data.result ? JSON.parse(data.result) : null;
    } catch (err) {
      console.warn(`[Redis] Fail to fetch key "${key}":`, err);
      return null;
    }
  }

  /**
   * Pushes high-conviction intelligence to the global state cache.
   */
  public async set(key: string, value: any, ex?: number): Promise<boolean> {
    if (!this.isActive) return false;

    try {
      const body = ex ? ["SET", key, JSON.stringify(value), "EX", ex] : ["SET", key, JSON.stringify(value)];
      const resp = await fetch(this.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return resp.ok;
    } catch (err) {
      console.warn(`[Redis] Fail to write key "${key}":`, err);
      return false;
    }
  }
}

export const upstashRedis = new RedisClient();
