import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(import.meta.dirname, "../public/images");
await mkdir(target, { recursive: true });
const photos = {
  hero: "photo-1613977257363-707ba9348227",
  "residence-1": "photo-1600607687939-ce8a6c25118c",
  "residence-2": "photo-1613490493576-7fde63acd811",
  "residence-3": "photo-1600047509807-ba8f99d2cdde",
  "residence-4": "photo-1600210492486-724fe5c67fb0",
  "residence-5": "photo-1613977257592-4871e5fcd7c4",
  "residence-6": "photo-1600607687920-4e2a09cf159d",
  "interior-1": "photo-1600210492486-724fe5c67fb0",
  "interior-2": "photo-1600607687920-4e2a09cf159d",
  "interior-3": "photo-1600566753086-00f18fb6b3ea",
  "neighborhood-1": "photo-1501594907352-04cda38ebc29",
  "neighborhood-2": "photo-1518837695005-2083093ee35b",
  "neighborhood-3": "photo-1448375240586-882707db888b",
  "agent-1": "photo-1580489944761-15a19d654956",
  "agent-2": "photo-1560250097-0b93528c311a",
  "agent-3": "photo-1534528741775-53994a69daeb",
};
await Promise.all(
  Object.entries(photos).map(async ([name, id]) => {
    const response = await fetch(
      `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${name === "hero" ? 2200 : name.startsWith("agent") ? 500 : 1200}&q=85`,
    );
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    await writeFile(
      resolve(target, `${name}.jpg`),
      Buffer.from(await response.arrayBuffer()),
    );
    console.info(`Saved ${name}`);
  }),
);
