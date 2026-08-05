import { test, expect } from "@playwright/test";

test.describe("PWA Navigation and Public Routes", () => {
  test("should render onboarding home page with action button", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText(/Gastos Conscientes/i);
    await expect(page.getByRole("link", { name: /Começar Agora/i })).toBeVisible();
  });

  test("should render login page with Google Auth button and form inputs", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h2")).toContainText(/Bem-vindo de volta/i);
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByPlaceholder(/seu@email.com/i)).toBeVisible();
  });

  test("should load PWA Web Manifest file", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe("Gastos Conscientes");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
  });
});
