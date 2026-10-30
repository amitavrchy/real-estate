import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const apiBase = process.env.E2E_API_URL || "http://127.0.0.1:4100";
const password = process.env.DEMO_PASSWORD || "HavenDemo2026!";
const marker = `browser-qa-${Date.now()}`;
test('production runtime optimizes images and sends security headers', async ({ request }) => {
  const image = await request.get('/_next/image?url=%2Fimages%2Fhero.jpg&w=480&q=60', {
    headers: { Accept: 'image/webp' },
  });
  expect(image.ok()).toBeTruthy();
  expect(image.headers()['content-type']).toContain('image/webp');
  expect((await image.body()).byteLength).toBeLessThan(100000);
  const health = await request.get('/api-health');
  expect(health.ok()).toBeTruthy();
  expect(health.headers()['x-content-type-options']).toBe('nosniff');
  expect(health.headers()['x-frame-options']).toBe('DENY');
  expect(health.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});

async function authenticate(page: Page, email = "buyer@haven.example") {
  const result = await page.request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
  expect(result.ok()).toBeTruthy();
  const { accessToken } = await result.json();
  await page.addInitScript(
    (token) => sessionStorage.setItem("haven-token", token),
    accessToken,
  );
  return accessToken as string;
}
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 550) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 35));
    }
  });
  await page.waitForTimeout(200);
}
test("home, minimum typography, command search, and mobile navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".listing-card")).toHaveCount(3);
  await scrollThrough(page);
  const undersized = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main *, header *, footer *"))
      .filter(
        (el) =>
          el.childNodes.length &&
          Array.from(el.childNodes).some(
            (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
          ) &&
          el.getBoundingClientRect().width > 0 &&
          getComputedStyle(el).display !== "none" &&
          parseFloat(getComputedStyle(el).fontSize) < 14,
      )
      .map((el) => ({
        text: el.textContent?.slice(0, 80),
        size: getComputedStyle(el).fontSize,
      })),
  );
  expect(undersized).toEqual([]);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search homes and people" })
    .fill("Ocean House");
  await expect(
    page.getByRole("dialog").getByRole("link", { name: /Ocean House/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Journal", exact: true })
    .click();
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Living is an art",
  );
  expect(errors).toEqual([]);
});
test("home search, filtering, ordering, pagination, and map hover stay connected", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "City, neighborhood, or address" })
    .fill("San Francisco");
  await page.getByRole("button", { name: "Find a home", exact: true }).click();
  await expect(page).toHaveURL(/q=San\+Francisco/);
  await expect(page.locator(".listing-card").first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Minimum bedrooms", exact: true })
    .selectOption("4");
  await expect(page.locator(".listing-card")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Sort homes" })
    .selectOption("price-desc");
  await expect(
    page.locator(".listing-card").first().getByRole("heading"),
  ).toHaveText("Ocean House");
  await page.locator(".listing-card").first().hover();
  await expect(page.locator(".pin-active")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.locator(".listing-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Discover more homes" }).click();
  await expect(page.locator(".listing-card")).toHaveCount(9);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Explore map" }).click();
  await expect(page.locator(".search-map")).toBeVisible();
  await page.getByRole("button", { name: "Show homes" }).click();
  await expect(page.locator(".search-map")).toBeHidden();
});
test("buyer signs in, saves a home, saves a search, and manages a collection note", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("buyer@haven.example");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Come on in" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Jamie");
  await page.goto("/property/ocean-house");
  await expect(
    page.getByRole("button", { name: /^(Unsave|Save) Ocean House$/ }),
  ).toBeVisible();
  const save = page.getByRole("button", {
    name: /^(Unsave|Save) Ocean House$/,
  });
  await expect(save).toBeEnabled();
  if ((await save.getAttribute("aria-pressed")) === "false") {
    await save.click();
    await expect(
      page.getByRole("button", { name: "Unsave Ocean House" }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Unsave Ocean House" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unsave Ocean House" }),
  ).toBeVisible();
  await page.goto("/collections");
  await page.getByRole("button", { name: "Create a collection" }).click();
  await page.getByLabel("Collection name", { exact: true }).fill(marker);
  await page.getByRole("button", { name: "Create your collection" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(marker);
  const id = page.url().split("/").pop();
  await page.getByRole("button", { name: "Add a home", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: "Ocean House" })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".collection-item")).toHaveCount(1);
  await page
    .getByLabel("A note to remember")
    .fill("The light, the view, the feeling of being home.");
  await page.getByRole("button", { name: "Save your note" }).click();
  await expect(
    page.getByRole("button", { name: "Save your note" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("A note to remember")).toHaveValue(
    "The light, the view, the feeling of being home.",
  );
  await page
    .getByRole("button", { name: "Delete collection", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete collection", exact: true })
    .click();
  await expect(page).toHaveURL("/collections");
  expect(id).toBeTruthy();
  await page.goto("/search?beds=4");
  await page.getByRole("button", { name: "Save search", exact: true }).click();
  await page.getByLabel("Name this search").fill(marker);
  await page
    .getByRole("button", { name: "Save this search", exact: true })
    .click();
  await page.goto("/account");
  await page.getByRole("tab", { name: /Saved searches/ }).click();
  await expect(page.getByRole("heading", { name: marker })).toBeVisible();
  await page
    .getByRole("button", { name: `Delete saved search ${marker}` })
    .click();
  await expect(page.getByRole("heading", { name: marker })).toHaveCount(0);
  await page.goto("/property/ocean-house");
  await page.getByRole("button", { name: "Unsave Ocean House" }).click();
  await expect(
    page.getByRole("button", { name: "Save Ocean House", exact: true }),
  ).toBeVisible();
});
test("property gallery keyboard controls, mortgage calculator, and inquiry delivery", async ({
  page,
}) => {
  await authenticate(page);
  await page.goto("/account");
  await expect(
    page.getByRole("tab", { name: /Your conversations/ }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Buy", exact: true })
    .click();
  await page
    .getByRole("link", { name: "View The Pacific Residence", exact: true })
    .click();
  await page.getByRole("button", { name: "View all 4 photos" }).click();
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "aria-label",
    /1 \/ 4/,
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "aria-label",
    /2 \/ 4/,
  );
  await page.keyboard.press("Escape");
  const before = await page.locator(".mortgage-result>strong").innerText();
  await page.getByRole("spinbutton", { name: "Interest rate" }).fill("0");
  await expect(page.locator(".mortgage-result>strong")).not.toHaveText(before);
  await page.getByRole("button", { name: "Connect with your advisor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your name").fill("Browser Quality");
  await dialog
    .getByLabel("Email address", { exact: true })
    .fill("browser@example.com");
  await dialog
    .getByLabel("A little about what you’re looking for")
    .fill(`${marker}: I would love to explore this residence in person.`);
  await dialog.getByRole("button", { name: "Start the conversation" }).click();
  await expect(dialog.getByText("A conversation starts here.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Jamie", exact: true })
    .click();
  await page.getByRole("tab", { name: /Your conversations/ }).click();
  await expect(
    page.getByText(
      `${marker}: I would love to explore this residence in person.`,
    ),
  ).toBeVisible();
});
test("agent can create, edit, publish, and manage a residence through the workspace", async ({
  page,
}) => {
  await authenticate(page, "alexandra@haven.example");
  await page.goto("/dashboard/listings");
  await page.getByRole("button", { name: "Add a residence" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Residence name", { exact: true })
    .fill(`${marker} Residence`);
  await dialog.getByLabel("Asking price (USD)").fill("2400000");
  await dialog
    .getByLabel("The story of this home")
    .fill(
      "A thoughtfully designed residence for a new chapter. Beautiful light and considered spaces.",
    );
  await dialog
    .getByLabel("Street address", { exact: true })
    .fill("100 Browser Test Avenue");
  await dialog
    .getByLabel("Cover image URL")
    .fill("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c");
  await dialog
    .getByRole("combobox", { name: "Listing status", exact: true })
    .selectOption("ACTIVE");
  await dialog
    .getByRole("button", { name: "Save residence", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText(`${marker} Residence`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Edit ${marker} Residence`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Asking price (USD)")
    .fill("2450000");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save residence", exact: true })
    .click();
  await expect(page.getByText("$2,450,000", { exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: `${marker} Residence` });
  await row
    .getByRole("link", { name: `View ${marker} Residence`, exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${marker} Residence`,
  );
  const slug = page.url().split("/").pop();
  const property = await (
    await page.request.get(`${apiBase}/properties/${slug}`)
  ).json();
  const adminLogin = await (
    await page.request.post(`${apiBase}/auth/login`, {
      data: { email: "admin@haven.example", password },
    })
  ).json();
  await page.request.delete(`${apiBase}/properties/${property.id}`, {
    headers: { Authorization: `Bearer ${adminLogin.accessToken}` },
  });
});
test("mobile pages remain within the viewport and controls stay usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/search",
    "/property/the-pacific-residence",
    "/agents",
    "/agents/agent-alexandra",
    "/journal",
    "/journal/the-art-of-living-slowly",
    "/sell",
    "/login",
    "/neighborhoods/pacific-heights",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scrollThrough(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      `${path} overflows`,
    ).toBe(false);
  }
});
test("home and property meet automated WCAG checks", async ({ page }) => {
  for (const path of ["/", "/property/the-pacific-residence"]) {
    await page.goto(path);
    await scrollThrough(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
});
