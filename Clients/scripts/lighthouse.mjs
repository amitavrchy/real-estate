import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.E2E_BASE_URL || "http://localhost:3001";
let failedBudgets = false;
await mkdir("test-results", { recursive: true });
for (const [name, path] of [
  ["home", "/"],
  ["property", "/property/the-pacific-residence"],
  ["search", "/search"],
]) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(`${base}${path}`, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      logLevel: "error",
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        disabled: false,
      },
    });
    if (!result) throw new Error("No Lighthouse result.");
    if (result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.message);
    await writeFile(`test-results/lighthouse-${name}.json`, result.report);
    console.info(
      JSON.stringify({
        page: name,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([k, v]) => [
            k,
            Math.round((v.score ?? 0) * 100),
          ]),
        ),
        LCP: result.lhr.audits["largest-contentful-paint"].displayValue,
        CLS: result.lhr.audits["cumulative-layout-shift"].displayValue,
      }),
    );
    const failed = Object.values(result.lhr.audits)
      .filter(
        (a) =>
          a.score !== null && a.score < 1 && a.details?.type !== "debugdata",
      )
      .map((a) => ({ id: a.id, title: a.title, display: a.displayValue }));
    console.info(JSON.stringify(failed.slice(0, 18)));
    const minimumPerformance = name === 'home' ? 0.9 : 0.7;
    if ((result.lhr.categories.performance.score ?? 0) < minimumPerformance ||
        (result.lhr.categories.accessibility.score ?? 0) < 0.9) {
      console.error(`Lighthouse budget failed for ${name}.`);
      failedBudgets = true;
    }
  } finally {
    await chrome.kill();
  }
}
if (failedBudgets) process.exitCode = 1;
