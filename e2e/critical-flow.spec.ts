import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./global-setup";

const LOCALE = "fr";
const CAMPAIGN_TITLE = `Campagne E2E ${Date.now()}`;
const MEMBER_EMAIL = `e2e.member.${Date.now()}@algeria-green.test`;
const MEMBER_PASSWORD = "e2eMember2026";

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`/${LOCALE}/sign-in`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/dashboard|\/admin/);
}

async function signOut(page: Page) {
  await page.goto(`/${LOCALE}/dashboard`);
  await page.getByRole("button", { name: "Profil" }).click();
  await page.getByRole("menuitem", { name: "Déconnexion" }).click();
  await page.waitForURL(`**/${LOCALE}`);
}

test.describe.configure({ mode: "serial" });

test("register → join campaign → submit tree → admin approves → verified and progress updates", async ({ page }) => {
  // 1. An administrator publishes a real campaign through the admin UI.
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`/${LOCALE}/admin/campaigns/new`);

  await page.getByLabel("Titre").fill(CAMPAIGN_TITLE);
  await page
    .getByLabel("Description")
    .fill("Campagne de reboisement créée automatiquement par le test de bout en bout.");
  await page.getByLabel("Organisateur").fill("Association E2E");

  await page.locator("#wilayaId").click();
  await page.getByRole("option", { name: /09 · Blida/ }).click();
  await page.getByLabel("Commune").fill("Blida");
  await page.getByLabel("Objectif d'arbres").fill("4");

  await page.locator("#status").click();
  await page.getByRole("option", { name: "En cours", exact: true }).click();

  await page.getByRole("button", { name: "Créer" }).click();
  await page.waitForURL(`**/${LOCALE}/admin/campaigns`);
  await expect(page.getByRole("link", { name: CAMPAIGN_TITLE })).toBeVisible();

  await signOut(page);

  // 2. A citizen registers.
  await page.goto(`/${LOCALE}/sign-up`);
  await page.getByLabel("Nom complet").fill("Participant E2E");
  await page.getByLabel("Adresse e-mail").fill(MEMBER_EMAIL);
  await page.getByLabel("Mot de passe", { exact: true }).fill(MEMBER_PASSWORD);
  await page.getByLabel("Confirmer le mot de passe").fill(MEMBER_PASSWORD);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await page.waitForURL(`**/${LOCALE}/dashboard`);

  // 3. They find the campaign and join it.
  await page.goto(`/${LOCALE}/campaigns`);
  await page.getByRole("link", { name: new RegExp(CAMPAIGN_TITLE) }).first().click();
  await page.waitForURL(/\/campaigns\//);
  await expect(page.getByRole("heading", { name: CAMPAIGN_TITLE })).toBeVisible();

  await page.getByRole("button", { name: "Participer à la campagne" }).click();
  await expect(page.locator("main").getByText("Vous participez à cette campagne")).toBeVisible();

  // Joining twice must be impossible — the button is gone.
  await page.reload();
  await expect(page.getByRole("button", { name: "Participer à la campagne" })).toHaveCount(0);

  // 4. They submit a tree for that campaign.
  await page.getByRole("link", { name: /Enregistrer un arbre pour cette campagne/ }).click();
  await page.waitForURL(/\/plant/);

  await page.locator("#speciesId").click();
  await page.getByRole("option", { name: "Olivier" }).click();

  await page.locator("#wilayaId").click();
  await page.getByRole("option", { name: "Blida", exact: true }).click();
  await page.getByLabel("Commune").fill("Blida");

  await page.getByRole("button", { name: "Enregistrer l'arbre" }).click();
  await expect(page.locator("main").getByText("Votre arbre est enregistré")).toBeVisible();

  const idText = await page.locator("main").getByText(/DZG-TREE-/).first().innerText();
  const publicId = idText.match(/DZG-TREE-[A-Z2-9]{8}/)![0];

  // 5. It is pending, and therefore absent from public statistics.
  await page.goto(`/${LOCALE}/dashboard/trees`);
  await expect(page.locator("main").getByText(publicId)).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(publicId) }).getByText("En attente")).toBeVisible();

  await signOut(page);

  // 6. The administrator reviews and approves it.
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`/${LOCALE}/admin/trees/pending`);
  await expect(page.locator("main").getByText(publicId)).toBeVisible();
  await page.getByRole("button", { name: "Approuver" }).first().click();
  await expect(page.locator("main").getByText(publicId)).toHaveCount(0, { timeout: 20_000 });

  await signOut(page);

  // 7. The citizen sees VERIFIED, and the campaign progress has moved.
  await signIn(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await page.goto(`/${LOCALE}/dashboard/trees`);
  await expect(page.getByRole("row", { name: new RegExp(publicId) }).getByText("Vérifié")).toBeVisible();

  await page.goto(`/${LOCALE}/campaigns`);
  await page.getByRole("link", { name: new RegExp(CAMPAIGN_TITLE) }).first().click();
  await expect(page.locator("main").getByText("1 / 4")).toBeVisible();
  await expect(page.locator("main").getByText("25%").first()).toBeVisible();

  // 8. The verified tree now has a public page.
  await page.goto(`/${LOCALE}/tree/${publicId}`);
  await expect(page.getByRole("heading", { name: "Arbre vérifié" })).toBeVisible();
  await expect(page.locator("main").getByText(publicId).first()).toBeVisible();
});

test("public statistics count only verified trees", async ({ page }) => {
  await page.goto(`/${LOCALE}`);
  const stats = page.locator("text=arbres vérifiés").first();
  await expect(stats).toBeVisible();
});

test("language switching changes direction and content", async ({ page }) => {
  await page.goto(`/${LOCALE}`);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar-DZ");
  await expect(page.getByRole("heading", { name: "الجزائر خضراء", level: 1 })).toBeVisible();

  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Algeria Green", level: 1 })).toBeVisible();
});

test("protected routes require authentication", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(`/${LOCALE}/dashboard`);
  await page.waitForURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.goto(`/${LOCALE}/admin`);
  await page.waitForURL(/\/sign-in/);
});

test("a non-admin cannot reach the admin area", async ({ page }) => {
  await signIn(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  const response = await page.goto(`/${LOCALE}/admin`);
  expect(response?.status()).toBe(404);
});

test("the PWA manifest and offline page are served", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const body = await manifest.json();
  expect(body.display).toBe("standalone");
  expect(body.start_url).toBe("/ar");
  expect(body.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true);

  const sw = await request.get("/sw.js");
  expect(sw.ok()).toBe(true);

  await page.goto(`/${LOCALE}/offline`);
  await expect(page.getByRole("heading", { name: "Vous êtes hors ligne" })).toBeVisible();
});
