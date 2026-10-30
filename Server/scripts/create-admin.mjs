import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }

// Password input is hidden and never accepted as a command-line argument.
let muted = false;
const output = new Writable({ write(chunk, encoding, done) {
  if (!muted) process.stdout.write(chunk, encoding);
  done();
} });
const terminal = createInterface({ input: process.stdin, output, terminal: true });
const db = new PrismaClient();
try {
  const email = (await terminal.question('Administrator email: ')).trim().toLowerCase();
  const name = (await terminal.question('Administrator name: ')).trim();
  process.stdout.write('Password (hidden, 12+ characters): ');
  muted = true;
  const password = await terminal.question('');
  process.stdout.write('\nConfirm password: ');
  const confirmation = await terminal.question('');
  muted = false;
  process.stdout.write('\n');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || name.length > 100)
    throw new Error('Provide a valid email and a name between 2 and 100 characters.');
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72 || password !== confirmation)
    throw new Error('Passwords must match, contain 12+ characters, and fit within 72 UTF-8 bytes.');
  if (await db.user.findUnique({ where: { email } }))
    throw new Error('That account already exists. Existing accounts are never promoted or overwritten by this command.');
  await db.user.create({ data: { email, name, passwordHash: await hash(password, 12), role: 'ADMIN' } });
  console.info('Administrator created. Sign in through the website.');
} catch (error) {
  muted = false;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  terminal.close();
  await db.$disconnect();
}
