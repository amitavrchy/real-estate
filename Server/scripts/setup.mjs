import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import {
  client,
  server,
  npm,
  completion,
  envFile,
  ensureDatabase,
  stopDatabase,
  isListening,
} from "./runtime.mjs";
const exists = async (path) =>
  access(path).then(
    () => true,
    () => false,
  );
let database;
try {
  if (process.env.NODE_ENV === "production")
    throw new Error("Use the production deployment guide; setup is development-only.");
  if (!(await exists(resolve(server, ".env"))))
    await writeFile(
      resolve(server, ".env"),
      `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/real_estate?schema=public\nJWT_SECRET=${randomBytes(48).toString("hex")}\nPORT=4100\nCLIENT_ORIGIN=http://localhost:3001\n`,
    );
  if (!(await exists(resolve(client, ".env.local"))))
    await writeFile(
      resolve(client, ".env.local"),
      "NEXT_PUBLIC_API_URL=http://127.0.0.1:4100\nNEXT_PUBLIC_SITE_URL=http://localhost:3001\n",
    );
  const existingEnv = await envFile(resolve(server, ".env"));
  for (const port of [3001, existingEnv.PORT || 4100])
    if (await isListening(port))
      throw new Error(
        `Stop the app on port ${port} before running setup. This prevents replacing dependencies that are in use.`,
      );
  console.info("Installing the client and API dependencies…");
  await Promise.all([
    completion(npm(["ci"], client)),
    completion(npm(["ci"], server)),
  ]);
  const env = await envFile(resolve(server, ".env"));
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Use manual production setup; demo seed is disabled in production.",
    );
  database = await ensureDatabase(env);
  for (const script of ["db:generate", "db:migrate", "db:seed"])
    await completion(npm(["run", script], server));
  console.info(
    "\nHaven is ready. Run npm --prefix Server run dev, then open http://localhost:3001.\nDemo account: buyer@haven.example / HavenDemo2026!\nSee Server/README.md for agent and admin accounts.",
  );
} finally {
  await stopDatabase(database);
}
