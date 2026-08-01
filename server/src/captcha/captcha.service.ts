import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { CacheService } from '../cache/cache.service';
import {
  CAPTCHA_KEY_PREFIX,
  CAPTCHA_TTL_SECONDS,
  CaptchaResponse,
} from './captcha.types';

@Injectable()
export class CaptchaService {
  constructor(private readonly cacheService: CacheService) {}

  async generate(): Promise<CaptchaResponse> {
    const captcha = svgCaptcha.create({
      size: 5,
      ignoreChars: '0oO1ilI',
      noise: 2,
      color: true,
      background: '#f4f4f4',
    });
    const id = randomUUID();

    await this.cacheService.set(
      this.buildKey(id),
      captcha.text.toLowerCase(),
      CAPTCHA_TTL_SECONDS,
    );

    return {
      id,
      image: captcha.data,
    };
  }

  async verify(id: string, value: string): Promise<void> {
    const key = this.buildKey(id);
    const expected = await this.cacheService.get<string>(key);

    await this.cacheService.del(key);

    if (!expected || expected !== value.trim().toLowerCase()) {
      throw new BadRequestException('Invalid CAPTCHA');
    }
  }

  private buildKey(id: string): string {
    return `${CAPTCHA_KEY_PREFIX}${id}`;
  }
}
