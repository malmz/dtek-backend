import { getQuery, Router, Status } from '../deps.ts';
import { db } from './db.ts';
import { lunchProvider } from './lunch.ts';
import { News } from './news.ts';

export { auth } from './ory_proxy.ts';

export const api = new Router({ prefix: '/api' });
api.get('/lunch', (ctx) => {
  const { name, lang } = getQuery(ctx);
  const setlang = lang ?? 'Swedish';
  if (!(setlang === 'Swedish' || setlang === 'English')) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = 'Invalid language';
  } else {
    try {
      const lunch = lunchProvider.getTodaysMenu(name, setlang);
      ctx.response.type = 'application/json';
      ctx.response.body = JSON.stringify(lunch);
    } catch (error) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = error.message;
    }
  }
});

api.get('/news', async (ctx) => {
  const news = await db.fetchNews();
  ctx.response.type = 'application/json';
  ctx.response.body = JSON.stringify(news);
});

api.post('/news', async (ctx) => {
  const news = (await ctx.request.body({ type: 'json' }).value) as News;
  await db.createNews(news);
  ctx.response.status = Status.Created;
});
