import { chromium, Browser, Page } from "playwright";
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";

describe("Medication Alerts E2E Tests", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security', '--allow-running-insecure-content']
    });
    page = await browser.newPage();
    await page.goto('http://localhost:8000');
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should display medication reminder at scheduled time", async () => {
    // Set up medication with 1-minute reminder for testing
    await page.click('[data-testid="add-medication"]');
    await page.fill('[data-testid="medication-name"]', 'Paracetamol 500mg');
    await page.fill('[data-testid="dosage-time"]', getTimeInMinutes(1));
    await page.click('[data-testid="save-medication"]');

    // Wait for alert to appear (with 5-second buffer)
    await page.waitForSelector('[data-testid="medication-alert"]', { timeout: 65000 });
    
    const alertText = await page.textContent('[data-testid="alert-message"]');
    assertEquals(alertText?.includes('Paracetamol 500mg'), true);
  });

  it("should provide accessible alert notifications", async () => {
    // Test screen reader compatibility
    const alertElement = await page.locator('[data-testid="medication-alert"]');
    
    // Check ARIA attributes
    const ariaLabel = await alertElement.getAttribute('aria-label');
    const role = await alertElement.getAttribute('role');
    
    assertExists(ariaLabel);
    assertEquals(role, 'alert');
    
    // Check for audio notification
    const audioElement = await page.locator('audio[data-testid="alert-sound"]');
    assertExists(audioElement);
  });

  it("should handle medication conflicts", async () => {
    // Add two medications that interact
    await setupMedicationConflict(page);
    
    // Verify conflict warning appears
    await page.waitForSelector('[data-testid="drug-interaction-warning"]');
    
    const warningText = await page.textContent('[data-testid="warning-message"]');
    assertEquals(warningText?.includes('interacción'), true);
  });

  it("should work offline with cached medications", async () => {
    // Set up medications while online
    await setupTestMedications(page);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Verify alerts still work
    const alert = await page.waitForSelector('[data-testid="medication-alert"]', { timeout: 65000 });
    assertExists(alert);
    
    // Restore online
    await page.context().setOffline(false);
  });

  it("should meet senior accessibility requirements", async () => {
    // Check minimum font size (18px)
    const fontSize = await page.evaluate(() => {
      const alertElement = document.querySelector('[data-testid="alert-message"]');
      return window.getComputedStyle(alertElement!).fontSize;
    });
    
    const fontSizeNum = parseInt(fontSize.replace('px', ''));
    assertEquals(fontSizeNum >= 18, true);
    
    // Check touch target size (44px minimum)
    const buttonSize = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="dismiss-alert"]');
      const rect = button!.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    
    assertEquals(buttonSize.width >= 44, true);
    assertEquals(buttonSize.height >= 44, true);
  });
});

// Helper functions
function getTimeInMinutes(minutes: number): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toTimeString().slice(0, 5); // HH:MM format
}

async function setupMedicationConflict(page: Page) {
  // Add Warfarin (blood thinner)
  await page.click('[data-testid="add-medication"]');
  await page.fill('[data-testid="medication-name"]', 'Warfarina 5mg');
  await page.click('[data-testid="save-medication"]');
  
  // Add Aspirin (also blood thinner - interaction!)
  await page.click('[data-testid="add-medication"]');
  await page.fill('[data-testid="medication-name"]', 'Aspirina 100mg');
  await page.click('[data-testid="save-medication"]');
}

async function setupTestMedications(page: Page) {
  const medications = [
    'Paracetamol 500mg',
    'Losartán 50mg',
    'Metformina 850mg'
  ];
  
  for (const med of medications) {
    await page.click('[data-testid="add-medication"]');
    await page.fill('[data-testid="medication-name"]', med);
    await page.fill('[data-testid="dosage-time"]', getTimeInMinutes(1));
    await page.click('[data-testid="save-medication"]');
  }
}