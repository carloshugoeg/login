import { buildContainer } from '../config/container.js';
import { loadEnv } from '../config/env.js';
import { createApp } from './app.js';

const env = loadEnv();
const container = buildContainer(env);
const app = createApp(container);

const server = app.listen(env.port, () => {
  console.log(`Servidor en ${env.baseUrl} (correo: ${env.mail.transport})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      container.close();
      process.exit(0);
    });
  });
}
