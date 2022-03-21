import { Cookie, Router, setCookie } from '../deps.ts';

const oryApiUrl = 'https://eloquent-golick-ppf6d00k3q.projects.oryapis.com';

function parseSetCookie(cookie: string): Cookie {
  const values = cookie.split(';');
  const [name, ...value] = values[0].split('=');
  const res: Record<string, unknown> = {
    name: name,
    value: value.join('='),
  };

  for (const prop of values.slice(1)) {
    const [propKey, ...propValue] = prop.split('=');
    const key = propKey.trim().toLowerCase();
    switch (key) {
      case 'domain':
        res.domain = propValue.join('=');
        break;
      case 'expires':
        res.expires = new Date(propValue.join('='));
        break;
      case 'httponly':
        res.httpOnly = true;
        break;
      case 'max-Age':
        res.maxAge = parseInt(propValue.join('='));
        break;
      case 'path':
        res.path = propValue.join('=');
        break;
      case 'samesite':
        res.sameSite = propValue.join('=');
        break;
      case 'secure':
        res.secure = true;
        break;
      default: {
        const l: string[] = (res.unparsed as string[]) ?? [];
        l.push(`${key}=${propValue.join('=')}`);
        res.unparsed = l;
        break;
      }
    }
  }
  return res as unknown as Cookie;
}

export const auth = new Router();
auth.all('/auth/:other*', async (ctx) => {
  const target = new URL(ctx.params.other ?? '', oryApiUrl);
  target.search = ctx.request.url.search;
  const headers = new Headers(ctx.request.headers);
  const getBody = () => {
    try {
      return ctx.request.body({ type: 'stream' }).value;
    } catch {
      return;
    }
  };
  const body = getBody();

  const req = new Request(target.toString(), {
    method: ctx.request.method,
    headers,
    body,
    redirect: 'manual',
  });

  const res = await fetch(req);

  ctx.response.status = res.status;
  for (const [key, val] of res.headers) {
    if (key === 'location') {
      if (val.startsWith(oryApiUrl)) {
        const newVal = val.replace(oryApiUrl, '/auth');
        ctx.response.headers.set(key, newVal);
      } else if (
        val.startsWith('/api/kratos/public/') ||
        val.startsWith('/self-service/') ||
        val.startsWith('/ui/')
      ) {
        const newVal = `/auth${val}`;
        ctx.response.headers.set(key, newVal);
      } else {
        ctx.response.headers.set(key, val);
      }
    } else if (key === 'set-cookie') {
      const cookie = parseSetCookie(val);
      setCookie(ctx.response.headers, {
        ...cookie,
        secure: ctx.request.secure,
        sameSite: ctx.request.secure ? cookie.sameSite : 'Lax',
        domain: ctx.request.url.hostname,
      });
    } else {
      ctx.response.headers.append(key, val);
    }
  }
  ctx.response.body = res.body;
});
