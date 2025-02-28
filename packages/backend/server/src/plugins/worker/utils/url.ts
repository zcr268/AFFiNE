import { getDomain, getSubdomain } from 'tldts';

import { imageProxyBuilder } from './proxy';

const localhost = new Set(['localhost', '127.0.0.1']);

export function fixUrl(url?: string): URL | null {
  if (typeof url !== 'string') {
    return null;
  }

  let fullUrl = url;

  // don't require // prefix, URL can handle protocol:domain
  if (!url.startsWith('http:') && !url.startsWith('https:')) {
    fullUrl = 'http://' + url;
  }

  try {
    const parsed = new URL(fullUrl);

    const subDomain = getSubdomain(url);
    const mainDomain = getDomain(url);
    const fullDomain = subDomain ? `${subDomain}.${mainDomain}` : mainDomain;

    if (
      ['http:', 'https:'].includes(parsed.protocol) &&
      // check hostname is a valid domain
      (fullDomain === parsed.hostname || localhost.has(parsed.hostname))
    ) {
      return parsed;
    }
  } catch {}

  return null;
}

export function appendUrl(url: string | null, array?: string[]) {
  if (url) {
    const fixedUrl = fixUrl(url);
    if (fixedUrl) {
      array?.push(fixedUrl.toString());
    }
  }
}

export async function reduceUrls(baseUrl: string, urls?: string[]) {
  if (urls && urls.length > 0) {
    const imageProxy = imageProxyBuilder(baseUrl);
    const newUrls = await Promise.all(urls.map(imageProxy));
    return newUrls.filter((x): x is string => !!x);
  }
  return [];
}
