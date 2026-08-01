import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CaptchaModule } from './captcha/captcha.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const parsed = new URL(redisUrl);

        return {
          connection: {
            host: parsed.hostname,
            port: parsed.port ? Number(parsed.port) : 6379,
            password: parsed.password
              ? decodeURIComponent(parsed.password)
              : undefined,
            username: parsed.username
              ? decodeURIComponent(parsed.username)
              : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    CacheModule,
    CaptchaModule,
    HealthModule,
    AuthModule,
    FilesModule,
    CommentsModule,
  ],
})
export class AppModule {}
