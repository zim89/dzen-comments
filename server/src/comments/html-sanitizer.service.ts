import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class HtmlSanitizerService {
  sanitize(text: string): string {
    return sanitizeHtml(text, {
      allowedTags: ['a', 'code', 'i', 'strong'],
      allowedAttributes: {
        a: ['href', 'title'],
      },
      disallowedTagsMode: 'discard',
    });
  }
}
