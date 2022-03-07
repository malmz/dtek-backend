import { Application, logger, oakCors } from './deps.ts';
import { router } from './src/router.ts';

const app = new Application();
app.use(logger.logger);
app.use(logger.responseTime);
app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Server running on http://localhost:3001');
await app.listen({ port: 3001 });
