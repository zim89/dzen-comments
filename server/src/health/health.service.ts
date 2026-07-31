import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type HealthStatus = 'ok' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  db: HealthStatus;
  redis: HealthStatus;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthResponse> {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);

    const db: HealthStatus = dbHealthy ? 'ok' : 'error';
    const redis: HealthStatus = redisHealthy ? 'ok' : 'error';
    const status: HealthStatus = db === 'ok' && redis === 'ok' ? 'ok' : 'error';

    return { status, db, redis };
  }
}
