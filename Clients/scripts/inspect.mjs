import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (error) => console.info("PAGE ERROR:", error.message));
page.on("console", (message) => {
  if (message.type() === "error")
    console.info("CONSOLE ERROR:", message.text().slice(0, 300));
});
await mkdir("test-results", { recursive: true });
await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
async function revealPage() {
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 650) { scrollTo(0, y); await new Promise(resolve => setTimeout(resolve, 80)); } });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1000);
}
await revealPage();
await page.screenshot({
  path: "test-results/home-desktop.png",
  fullPage: true,
});
console.info("Home title:", await page.title());
console.info("Cards:", await page.locator(".listing-card").count());
await page.setViewportSize({ width: 390, height: 844 });
await revealPage();
await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
console.info(
  "Mobile overflow:",
  await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  ),
);
await browser.close();
