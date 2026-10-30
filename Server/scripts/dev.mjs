import { resolve } from "node:path";
import {
  client,
  server,
  envFile,
  ensureDatabase,
  stopDatabase,
  npm,
  isListening,
  stopProcess,
} from "./runtime.mjs";
let database;
const children = [];
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(stopProcess));
  await stopDatabase(database);
}
process.on("SIGINT", () => {
  stop().then(() => process.exit(0));
});
process.on("SIGTERM", () => {
  stop().then(() => process.exit(0));
});
try {
  const env = await envFile(resolve(server, ".env"));
  if (process.env.NODE_ENV === 'production' || env.NODE_ENV === 'production')
    throw new Error('Development tooling cannot run against a production environment.');
  for (const port of [3001, env.PORT || 4100])
    if (await isListening(port))
      throw new Error(
        `Port ${port} is already in use. Stop your existing Haven development process before starting another.`,
      );
  database = await ensureDatabase(env);
  children.push(npm(["run", "start:dev"], server), npm(["run", "dev"], client));
  console.info(
    "\nHaven: http://localhost:3001\nKeep this terminal open. Ctrl+C gracefully stops the client, API, and local database.\n",
  );
  await Promise.race(
    children.map(
      (child) =>
        new Promise((resolve, reject) => {
          child.once("error", reject);
          child.once("exit", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`Development process stopped (${code}).`)),
          );
        }),
    ),
  );
} catch (error) {
  console.error(
    error.message.includes("ENOENT")
      ? "Run npm --prefix Server run setup first."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  await stop();
}
