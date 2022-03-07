import { getQuery, Router, Status } from '../deps.ts';
import { fetchNews } from '../news.ts';
import { lunchProvider } from './lunch.ts';

export const router = new Router();
router.get('/', (ctx) => {
  ctx.response.body = 'Hello World!';
});
router.get('/lunch', (ctx) => {
  const { name, lang } = getQuery(ctx);
  const setlang = lang ?? 'Swedish';
  if (!(setlang === 'Swedish' || setlang === 'English')) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = 'Invalid language';
  } else {
    try {
      const lunch = lunchProvider.getTodaysMenu(name, setlang);
      ctx.response.body = JSON.stringify(lunch);
    } catch (error) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = error.message;
    }
  }
});

router.get('/news', async (ctx) => {
  const news = await fetchNews();
  ctx.response.body = JSON.stringify(news);
});
