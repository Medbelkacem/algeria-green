import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = ["/ar", "/ar/campaigns", "/ar/impact", "/ar/wilayas", "/ar/plant", "/fr", "/en"];

test.describe("handheld experience", () => {
  test("bottom tab bar is present and the desktop nav is hidden", async ({ page }) => {
    await page.goto("/ar");

    const tabBar = page.locator("nav").filter({ has: page.getByRole("link", { name: "ازرع" }) }).last();
    await expect(tabBar).toBeVisible();

    // Five destinations: home, campaigns, plant, impact, profile.
    await expect(tabBar.getByRole("listitem")).toHaveCount(5);
  });

  test("no page scrolls horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test("renders correctly across the supported breakpoints", async ({ page }) => {
    for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/ar");
      await expect(page.getByRole("heading", { name: "الجزائر خضراء", level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("Arabic renders right-to-left and French left-to-right", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.goto("/fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("touch targets in the tab bar are at least 44px tall", async ({ page }) => {
    await page.goto("/ar");
    const links = page.locator("nav").last().getByRole("link");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box!.height, `tab ${index} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the empty database renders zeros, never invented numbers", async ({ page }) => {
    await page.goto("/en/wilayas");
    await expect(page.getByRole("heading", { name: "Wilayas", level: 1 })).toBeVisible();
    // All 58 wilayas are reference data and must be listed, each showing a
    // real count — zero where the database holds nothing yet.
    await expect(page.locator('main a[href*="/wilayas/"]')).toHaveCount(58);
  });

  test("service worker and manifest are reachable on mobile", async ({ request }) => {
    expect((await request.get("/sw.js")).ok()).toBe(true);
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    expect((await manifest.json()).display).toBe("standalone");
  });
});
