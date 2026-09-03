import { expect, test } from "@playwright/test";

/**
 * Read-only checks against a live deployment. Nothing here creates an account,
 * a campaign or a tree — production stays free of test content.
 */

test("the root redirects into a locale and renders the Arabic hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(ar|fr|en)$/);
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "الجزائر خضراء", level: 1 })).toBeVisible();
  await expect(page.locator("main").getByText("نغرس اليوم، نبني غدًا.")).toBeVisible();
});

test("statistics come from the database and read zero while it is empty", async ({ page }) => {
  await page.goto("/en");
  const statCard = page.locator("main").locator("div", { hasText: /^0verified trees$/ }).first();
  await expect(statCard).toBeVisible();
  await expect(page.getByText("Only verified trees are counted.")).toBeVisible();
});

test("empty states are shown instead of invented content", async ({ page }) => {
  await page.goto("/en/campaigns");
  await expect(page.getByText("No campaigns are available right now.")).toBeVisible();

  await page.goto("/en/impact");
  await expect(page.getByText("No verified data to display yet.").first()).toBeVisible();
});

test("all three languages render with the correct direction", async ({ page }) => {
  for (const [locale, dir, heading] of [
    ["ar", "rtl", "الجزائر خضراء"],
    ["fr", "ltr", "Algérie Verte"],
    ["en", "ltr", "Algeria Green"],
  ] as const) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("dir", dir);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
});

test("the language switcher moves between locales", async ({ page }) => {
  await page.goto("/en/campaigns");
  await page.getByRole("button", { name: "Language" }).click();
  await page.getByRole("menuitem", { name: "Français" }).click();
  await expect(page).toHaveURL(/\/fr\/campaigns/);
  await expect(page.getByRole("heading", { name: "Campagnes de reboisement" })).toBeVisible();
});

test("the map and wilaya pages load with all 58 wilayas", async ({ page }) => {
  await page.goto("/en/wilayas");
  await expect(page.locator('main a[href*="/wilayas/"]')).toHaveCount(58);

  await page.goto("/en/wilayas/16");
  await expect(page.getByRole("heading", { name: "Algiers", level: 1 })).toBeVisible();

  await page.goto("/en/map");
  await expect(page.getByText("Locations are deliberately approximate")).toBeVisible();
});

test("protected areas require a session", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("unknown paths return a translated 404", async ({ page }) => {
  const response = await page.goto("/fr/aucune-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("the PWA is installable and the offline page is reachable", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const body = await manifest.json();
  expect(body.display).toBe("standalone");
  expect(body.start_url).toBe("/ar");
  expect(body.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  expect(body.shortcuts.length).toBeGreaterThan(0);

  expect((await request.get("/sw.js")).ok()).toBe(true);
  expect((await request.get("/icons/icon-192.png")).ok()).toBe(true);
  expect((await request.get("/icons/icon-maskable-512.png")).ok()).toBe(true);

  await page.goto("/en/offline");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
});

test("the sign-in and sign-up forms render and validate", async ({ page }) => {
  await page.goto("/en/sign-in");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

  await page.goto("/en/sign-up");
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByText("At least 8 characters, including a letter and a number.")).toBeVisible();
});

test("the planting page asks unauthenticated visitors to sign in", async ({ page }) => {
  await page.goto("/en/plant");
  await expect(page.getByText("Sign in to record a tree.")).toBeVisible();
});

test("SEO surfaces are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const locale of ["/ar", "/fr", "/en"]) {
    expect(xml).toContain(`${locale}/campaigns`);
  }
});

test("no page scrolls horizontally on a handheld viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const path of ["/ar", "/ar/campaigns", "/ar/impact", "/ar/wilayas", "/fr", "/en"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
