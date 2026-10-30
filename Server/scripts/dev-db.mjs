import 'dotenv/config';
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

if (process.env.NODE_ENV === 'production') throw new Error('Embedded Postgres is for local development only.');
const url = new URL(process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/real_estate');
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Use a local DATABASE_URL for the development database.');
const directory = resolve(import.meta.dirname, '../.local/postgres');
const pg = new EmbeddedPostgres({ databaseDir: directory, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), port: Number(url.port || 5432), persistent: true, onLog: () => {}, onError: (error) => console.error(String(error)) });
if (!existsSync(resolve(directory, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const name = url.pathname.slice(1);
if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Invalid database name.');
const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
if (!result.rows.length) await pg.createDatabase(name);
await client.end();
console.info(`Local Postgres 16 is ready on ${url.hostname}:${url.port || 5432}. Keep this terminal open.`);
process.send?.('ready');
let stopping = false;
async function stop() { if (stopping) return; stopping = true; await pg.stop(); process.exit(0); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
process.on('message', message => { if (message === 'stop') stop(); });
setInterval(() => {}, 60000);
