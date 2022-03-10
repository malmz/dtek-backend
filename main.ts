import { Application, logger, oakCors, Status } from './deps.ts';
import { db } from './src/db.ts';
import { router } from './src/router.ts';

await db.init();

const app = new Application();
app.use(logger.logger);
app.use(logger.responseTime);
app.use(oakCors());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = error.message;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log('Server running on http://localhost:3001');
await app.listen({ port: 3001 });
