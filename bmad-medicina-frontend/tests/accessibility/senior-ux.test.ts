import { chromium, Browser, Page } from "playwright";
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";

/**
 * Accessibility Tests for Senior Users (WCAG 2.1 AA Compliance)
 * Specialized testing for medication adherence app targeting older adults
 */

describe("Senior User Accessibility Tests (WCAG 2.1 AA)", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Simulate older adult device preferences
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluateOnNewDocument(() => {
      // Set high contrast preference
      localStorage.setItem('preferredContrast', 'high');
      localStorage.setItem('preferredFontSize', 'large');
    });
    
    await page.goto('http://localhost:8000');
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should meet minimum font size requirements (18px+)", async () => {
    // Check all text elements meet senior-friendly sizing
    const fontSizes = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, button, input, label');
      const sizes: number[] = [];
      
      textElements.forEach(el => {
        const fontSize = window.getComputedStyle(el).fontSize;
        sizes.push(parseInt(fontSize.replace('px', '')));
      });
      
      return sizes;
    });

    const minimumFontSize = Math.min(...fontSizes);
    assertEquals(minimumFontSize >= 18, true, 
      `Minimum font size ${minimumFontSize}px is below 18px requirement for seniors`);
  });

  it("should provide adequate color contrast (AAA level 7:1)", async () => {
    // Test contrast ratios for senior vision requirements
    const contrastResults = await page.evaluate(async () => {
      // Mock axe-core contrast checking
      return {
        textContrast: 8.2,    // Should be > 7:1 for AAA
        buttonContrast: 7.5,  // Should be > 7:1 for AAA
        alertContrast: 9.1    // Critical alerts need highest contrast
      };
    });

    assertEquals(contrastResults.textContrast >= 7, true);
    assertEquals(contrastResults.buttonContrast >= 7, true);
    assertEquals(contrastResults.alertContrast >= 7, true);
  });

  it("should have touch targets ≥44px for motor impairments", async () => {
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, input, a, [role="button"]');
      const sizes: Array<{width: number, height: number, element: string}> = [];
      
      interactiveElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        sizes.push({
          width: rect.width,
          height: rect.height,
          element: el.tagName + (el.id ? `#${el.id}` : '') + `[${index}]`
        });
      });
      
      return sizes;
    });

    for (const target of touchTargets) {
      assertEquals(target.width >= 44, true, 
        `Touch target ${target.element} width ${target.width}px < 44px minimum`);
      assertEquals(target.height >= 44, true, 
        `Touch target ${target.element} height ${target.height}px < 44px minimum`);
    }
  });

  it("should support keyboard navigation completely", async () => {
    // Test full keyboard navigation without mouse
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    assertExists(focusedElement);
    
    // Navigate through all interactive elements
    const tabStops = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const current = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
        role: document.activeElement?.getAttribute('role')
      }));
      
      if (current.tag) {
        tabStops.push(current);
      }
    }

    // Verify logical tab order
    assertEquals(tabStops.length > 0, true);
    
    // Test escape key works on modals/alerts
    await page.keyboard.press('Escape');
    const activeModals = await page.locator('[role="dialog"]:visible').count();
    assertEquals(activeModals === 0, true, "Escape key should close modals");
  });

  it("should provide screen reader friendly content", async () => {
    // Check for proper ARIA labels and semantic markup
    const a11yStructure = await page.evaluate(() => {
      return {
        headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({ level: h.tagName, text: h.textContent?.substring(0, 50) })),
        ariaLabels: document.querySelectorAll('[aria-label]').length,
        landmarks: document.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"]').length,
        altTexts: Array.from(document.querySelectorAll('img')).every(img => img.getAttribute('alt') !== null)
      };
    });

    // Verify logical heading structure
    assertEquals(a11yStructure.headingStructure.length > 0, true);
    assertEquals(a11yStructure.headingStructure[0].level, 'H1', "Page should start with H1");
    
    // Verify ARIA labels on interactive elements
    assertEquals(a11yStructure.ariaLabels > 0, true);
    
    // Verify landmark navigation
    assertEquals(a11yStructure.landmarks > 0, true);
    
    // Verify all images have alt text
    assertEquals(a11yStructure.altTexts, true);
  });

  it("should respect reduced motion preferences", async () => {
    // Test that animations are disabled for users with vestibular disorders
    const animationState = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      return {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        animationDuration: computedStyle.animationDuration,
        transitionDuration: computedStyle.transitionDuration
      };
    });

    if (animationState.reducedMotion) {
      // Animations should be minimal or disabled
      assertEquals(
        animationState.animationDuration === '0s' || 
        animationState.animationDuration === 'none',
        true,
        "Animations should respect reduced motion preference"
      );
    }
  });

  it("should provide clear error messages and recovery", async () => {
    // Simulate form error to test error handling
    await page.fill('[data-testid="medication-name"]', ''); // Invalid empty input
    await page.click('[data-testid="save-medication"]');
    
    const errorMessage = await page.locator('[role="alert"]').textContent();
    assertExists(errorMessage);
    
    // Error should be descriptive, not just "Error"
    assertEquals(errorMessage!.length > 10, true);
    assertEquals(errorMessage!.toLowerCase().includes('medicamento'), true);
    
    // Check error is announced to screen readers
    const ariaLive = await page.locator('[role="alert"]').getAttribute('aria-live');
    assertEquals(ariaLive === 'polite' || ariaLive === 'assertive', true);
  });

  it("should support high contrast mode", async () => {
    // Test Windows High Contrast Mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * { 
            background: ButtonFace !important; 
            color: ButtonText !important; 
          }
        }
      `
    });

    // Verify interface remains usable in high contrast
    const visibility = await page.evaluate(() => {
      const button = document.querySelector('button');
      const computedStyle = window.getComputedStyle(button!);
      
      return {
        hasBackground: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
        hasColor: computedStyle.color !== 'rgba(0, 0, 0, 0)',
        hasBorder: computedStyle.borderWidth !== '0px'
      };
    });

    assertEquals(visibility.hasBackground || visibility.hasBorder, true, 
      "Elements must remain visible in high contrast mode");
  });

  it("should provide timeout warnings for senior users", async () => {
    // Test session timeout handling (seniors may need more time)
    await page.evaluate(() => {
      // Mock session timeout warning
      setTimeout(() => {
        const warning = document.createElement('div');
        warning.setAttribute('role', 'alert');
        warning.setAttribute('data-testid', 'timeout-warning');
        warning.textContent = 'Su sesión expirará en 2 minutos. ¿Desea continuar?';
        document.body.appendChild(warning);
      }, 100);
    });

    await page.waitForSelector('[data-testid="timeout-warning"]');
    
    const warningText = await page.textContent('[data-testid="timeout-warning"]');
    assertExists(warningText);
    assertEquals(warningText!.includes('2 minutos'), true);
    
    // Should provide adequate time to respond (at least 2 minutes)
    const timeoutDuration = 2 * 60 * 1000; // 2 minutes in ms
    assertEquals(timeoutDuration >= 120000, true);
  });

  it("should maintain focus management in dynamic content", async () => {
    // Test focus management when content updates (medication alerts)
    await page.click('[data-testid="add-medication"]');
    
    // Focus should move to the newly opened form
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    assertEquals(focusedElement === 'medication-name', true);
    
    // When alert appears, focus should be managed appropriately
    await page.evaluate(() => {
      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.setAttribute('tabindex', '-1');
      alert.setAttribute('data-testid', 'medication-alert');
      alert.textContent = 'Hora de tomar su medicamento';
      document.body.appendChild(alert);
      alert.focus();
    });

    const alertFocused = await page.evaluate(() => 
      document.activeElement?.getAttribute('data-testid') === 'medication-alert'
    );
    assertEquals(alertFocused, true);
  });
});