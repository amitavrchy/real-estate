import { spawn, fork, execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import net from "node:net";

export const server = resolve(import.meta.dirname, "..");
export const root = resolve(server, "..");
export const client = resolve(root, "Clients");
export async function envFile(path) {
  const text = await readFile(path, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [
          line.slice(0, i),
          line
            .slice(i + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}
export function npm(args, cwd) {
  const cli = process.env.npm_execpath || resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(cli)) throw new Error('Run this tool with npm run so the npm CLI can be located.');
  return spawn(process.execPath, [cli, ...args], {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
}
export function completion(child) {
  return new Promise((res, rej) => {
    child.on("error", rej);
    child.on("exit", (code) =>
      code === 0
        ? res()
        : rej(new Error(`Command failed with exit code ${code}.`)),
    );
  });
}
export function isListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: Number(port), host });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
export async function ensureDatabase(env) {
  const url = new URL(env.DATABASE_URL);
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error(
      "Automatic development setup only supports a local database. Use the documented manual commands for a managed Postgres connection.",
    );
  if (await isListening(url.port || 5432)) return null;
  const child = fork(resolve(server, "scripts/dev-db.mjs"), [], {
    cwd: server,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    windowsHide: true,
  });
  await new Promise((res, rej) => {
    child.once("message", (message) => message === "ready" && res());
    child.once("error", rej);
    child.once("exit", (code) =>
      rej(new Error(`Local database stopped with code ${code}.`)),
    );
  });
  return child;
}
export async function stopDatabase(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.send("stop");
  await exited;
}
export function stopProcess(child) {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    if (process.platform === "win32")
      execFile(
        "taskkill",
        ["/pid", String(child.pid), "/T", "/F"],
        { windowsHide: true },
        () => resolve(),
      );
    else {
      child.kill("SIGTERM");
      child.once("exit", resolve);
    }
  });
}
