import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home dropdowns support pointer, keyboard, dismissal and rental form submission", async ({
  page,
}) => {
  await page.goto("/");
  const price = page.getByRole("combobox", {
    name: "Maximum price",
    exact: true,
  });
  const beds = page.getByRole("combobox", {
    name: "Minimum bedrooms",
    exact: true,
  });
  await price.click();
  await page.getByRole("option", { name: "Up to $3M", exact: true }).click();
  await expect(price).toHaveText("Up to $3M");
  await expect(price).toBeFocused();
  await beds.focus();
  await beds.press("Enter");
  await beds.press("3");
  await beds.press("Enter");
  await expect(beds).toHaveText("3+ bedrooms");

  await price.click();
  await beds.click();
  await expect(price).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("listbox")).toHaveCount(1);
  await beds.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(beds).toBeFocused();
  await price.click();
  await page.locator(".hero h1").click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await price.focus();
  await price.press("ArrowDown");
  await price.press("End");
  await price.press("Enter");
  await expect(price).toHaveText("Up to $8M");
  await price.click();
  await price.press("Tab");
  await expect(page.getByRole("listbox")).toHaveCount(0);

  await page
    .locator(".search-purpose")
    .getByRole("button", { name: "Rent", exact: true })
    .click();
  await expect(price).toHaveText("Any price");
  await price.click();
  await expect(
    page.getByRole("option", { name: "Up to $3M", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("option", { name: "Up to $10K", exact: true }).click();
  await page.getByRole("button", { name: "Find a home", exact: true }).click();
  await expect(page).toHaveURL(/\/rent\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get("type")).toBe("RENT");
  expect(url.searchParams.get("maxPrice")).toBe("10000");
  expect(url.searchParams.get("beds")).toBe("3");
});

test("dropdowns fit mobile screens and the team content, FAQs and advisor links work", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Maximum price", "Minimum bedrooms"]) {
      const control = page.getByRole("combobox", { name, exact: true });
      await control.click();
      const menu = page.getByRole("listbox");
      await expect(menu).toBeVisible();
      const bounds = await menu.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await control.press("Escape");
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/agents");
  await expect(page.locator(".team-directory .agent-card")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Good homes start with good people." }),
  ).toBeVisible();
  await expect(page.locator(".team-advisor-bio").first()).not.toBeEmpty();
  await expect(page.locator(".team-value-card")).toHaveCount(3);
  const firstQuestion = page.getByText("How do I choose the right advisor?", {
    exact: true,
  });
  const secondQuestion = page.getByText("Can you help me buy and sell?", {
    exact: true,
  });
  await firstQuestion.click();
  await expect(firstQuestion.locator("..")).toHaveAttribute("open", "");
  await secondQuestion.click();
  await expect(firstQuestion.locator("..")).not.toHaveAttribute("open", "");
  await expect(secondQuestion.locator("..")).toHaveAttribute("open", "");
  await secondQuestion.press("Enter");
  await expect(secondQuestion.locator("..")).not.toHaveAttribute("open", "");

  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("link", { name: "Get to know Alexandra", exact: true })
    .click();
  await expect(page).toHaveURL(/\/agents\/agent-alexandra$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Alexandra",
  );
});
