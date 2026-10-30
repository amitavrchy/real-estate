import { resolve } from 'node:path';
import { server, client, npm, completion, envFile, ensureDatabase, stopDatabase, isListening, stopProcess } from './runtime.mjs';
import { spawn } from 'node:child_process';

const children = [];
let database;
async function waitFor(url, child) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Verification service exited: ${url}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Verification service was not ready: ${url}`);
}
async function cleanup() {
  await Promise.all(children.map(stopProcess));
  await stopDatabase(database);
}
process.once('SIGINT', () => cleanup().then(() => process.exit(130)));
process.once('SIGTERM', () => cleanup().then(() => process.exit(143)));
try {
  const env = await envFile(resolve(server, '.env'));
  if (process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production')
    throw new Error('Verification must use an isolated development database, never production.');
  for (const port of [3001, env.PORT || 4100])
    if (await isListening(port)) throw new Error(`Stop the app on port ${port} before verification.`);
  database = await ensureDatabase(env);
  await completion(npm(['run', 'db:generate'], server));
  await completion(npm(['run', 'db:migrate'], server));
  await completion(npm(['run', 'typecheck'], server));
  await completion(npm(['run', 'typecheck'], client));
  await completion(npm(['test'], server));
  await completion(npm(['run', 'build:all'], server));
  const api = spawn(process.execPath, ['--env-file=.env', 'dist/main.js'], { cwd: server, stdio: 'inherit', windowsHide: true });
  children.push(api);
  await waitFor(`http://127.0.0.1:${env.PORT || 4100}/health`, api);
  const web = npm(['start', '--', '-p', '3001'], client);
  children.push(web);
  await waitFor('http://localhost:3001/api-health', web);
  await completion(npm(['run', 'test:e2e'], server));
  await completion(npm(['run', 'test:e2e'], client));
  await completion(npm(['run', 'test:performance'], client));
  await completion(npm(['audit', '--omit=dev', '--audit-level=moderate'], server));
  await completion(npm(['audit', '--omit=dev', '--audit-level=moderate'], client));
  console.info('Production builds, integration tests, browser journeys, accessibility, performance and dependency audits passed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await cleanup();
}
