export const CAPTCHA_KEY_PREFIX = 'captcha:';
export const CAPTCHA_TTL_SECONDS = 300;

export type CaptchaResponse = {
  id: string;
  image: string;
};
