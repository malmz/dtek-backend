import {
  Application,
  Router,
  helpers,
} from 'https://deno.land/x/oak@v10.4.0/mod.ts';
import { oakCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';
import logger from 'https://deno.land/x/oak_logger@1.0.0/mod.ts';

import { getLunch, getLunchByName } from './lunch.ts';
import { fetchNews } from './news.ts';
const { getQuery } = helpers;

const router = new Router();
router.get('/', (ctx) => {
  ctx.response.body = 'Hello World!';
});
router.get('/lunch', async (ctx) => {
  const { name } = getQuery(ctx);
  const lunch = await getLunchByName(name);
  ctx.response.body = JSON.stringify(lunch);
});

router.get('/news', async (ctx) => {
  const news = await fetchNews();
  ctx.response.body = JSON.stringify(news);
});

const app = new Application();
app.use(logger.logger);
app.use(logger.responseTime);
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Server running on http://localhost:3001');
await app.listen({ port: 3001 });
