import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisService.getClient().get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redisService
      .getClient()
      .set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redisService.getClient().del(key);
  }

  async invalidate(pattern: string): Promise<void> {
    const client = this.redisService.getClient();
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  }
}
