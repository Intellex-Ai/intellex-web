import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export function parseHtml(html: string) {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return {
    title: article?.title ?? '',
    text: (article?.textContent ?? '').trim()
  };
}
