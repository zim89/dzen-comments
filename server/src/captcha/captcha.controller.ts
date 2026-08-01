import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CaptchaService } from './captcha.service';
import { CaptchaResponse } from './captcha.types';

@Public()
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  getCaptcha(): Promise<CaptchaResponse> {
    return this.captchaService.generate();
  }
}
