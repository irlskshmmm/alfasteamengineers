// Entry point: node --env-file-if-exists=.env src/index.mjs   (or: npm start)
import { createServer } from 'node:http';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';
import { createSyncer } from './sync/index.mjs';
import { createNotifier } from './notify.mjs';
import { createApp } from './app.mjs';

const config = loadConfig();
const db = openDb(config.dbPath);
const syncer = createSyncer(config, db);
const notifier = createNotifier(config);
const app = createApp({ config, db, syncer, notifier });

for (const p of config.problems) console.warn(`[config] ${p}`);
console.log(`[enquiry] database: ${config.dbPath}`);
console.log(`[enquiry] Excel register: ${config.registerPath}`);
console.log(`[enquiry] spreadsheet sync: ${syncer.provider}; email notifications: ${notifier.enabled ? 'on' : 'off'}`);

syncer.start();
setTimeout(() => syncer.runDue().catch(() => {}), 2000).unref();

const server = createServer(app);
server.listen(config.port, config.host, () => console.log(`[enquiry] listening on http://${config.host}:${config.port}`));

async function shutdown() {
  console.log('[enquiry] shutting down…');
  syncer.stop();
  server.close();
  try { await app.flushRegister(); } catch (e) { console.warn('[register]', e.message); }
  db.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
