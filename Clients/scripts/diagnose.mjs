import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await page.goto("http://localhost:3001/property/the-pacific-residence");
await page.waitForTimeout(500);
console.info(
  await page.evaluate(() => ({
    width: innerWidth,
    total: document.documentElement.scrollWidth,
    outside: Array.from(document.querySelectorAll("body *"))
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return (
          b.width &&
          (b.right > innerWidth + 1 || b.left < -1) &&
          !el.closest(".leaflet-container")
        );
      })
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        width: el.getBoundingClientRect().width,
        right: el.getBoundingClientRect().right,
        text: el.textContent?.slice(0, 50),
      }))
      .slice(0, 30),
  })),
);
await browser.close();
