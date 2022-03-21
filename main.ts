import { Application, logger, oakCors, Status } from './deps.ts';
import { db } from './src/db.ts';
import { api, auth } from './src/router.ts';

await db.init();

const app = new Application();
app.use(logger.logger);
app.use(logger.responseTime);
app.use(
  oakCors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = error.message;
  }
});

app.use(api.routes());
app.use(api.allowedMethods());

app.use(auth.routes());
app.use(auth.allowedMethods());

app.use((ctx) => {
  // Auth Proxy calls next even when matching route is not found
  if (!ctx.request.url.pathname.startsWith('/auth')) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = 'Not found';
  }
});

app.addEventListener('listen', (info) => {
  const proto = info.secure ? 'https' : 'http';
  console.log(`Server running on ${proto}://${info.hostname}:${info.port}`);
});

await app.listen({ port: 3001 });
