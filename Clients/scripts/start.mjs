import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const client = resolve(import.meta.dirname, '..');
const standalone = resolve(client, '.next/standalone');
await cp(resolve(client, 'public'), resolve(standalone, 'public'), { recursive: true });
await cp(resolve(client, '.next/static'), resolve(standalone, '.next/static'), { recursive: true });
const args = process.argv.slice(2);
const portIndex = args.findIndex(arg => arg === '-p' || arg === '--port');
const port = portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || '3001';
const child = spawn(process.execPath, [resolve(standalone, 'server.js')], {
  cwd: client, stdio: 'inherit', windowsHide: true,
  env: { ...process.env, PORT: port, HOSTNAME: process.env.HOSTNAME || '0.0.0.0' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
