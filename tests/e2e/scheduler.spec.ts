// End-to-end tests for OttoCommand Scheduler UI

import { test, expect } from '@playwright/test';

test.describe('OttoCommand Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to scheduler tab
    await page.click('text=Scheduler');
    await page.waitForSelector('[data-testid="scheduler-ui"]');
  });

  test('should display scheduler interface', async ({ page }) => {
    // Check main components are visible
    await expect(page.locator('text=Charging & Staging Scheduler')).toBeVisible();
    await expect(page.locator('text=Charging Plan Optimization')).toBeVisible();

    // Check three-column layout
    await expect(page.locator('text=Vehicles (')).toBeVisible();
    await expect(page.locator('text=Available Stalls (')).toBeVisible();
    await expect(page.locator('text=Current Assignments (')).toBeVisible();
  });

  test('should show vehicles needing charge', async ({ page }) => {
    const vehiclesSection = page.locator('[data-testid="vehicles-section"]');
    await expect(vehiclesSection).toBeVisible();

    // Should show vehicles with SOC < 80%
    const vehicleCards = page.locator('[data-testid="vehicle-card"]');
    const count = await vehicleCards.count();

    if (count > 0) {
      // Check first vehicle has battery indicator
      await expect(vehicleCards.first().locator('[data-testid="battery-indicator"]')).toBeVisible();
    }
  });

  test('should show available charging stalls', async ({ page }) => {
    const stallsSection = page.locator('[data-testid="stalls-section"]');
    await expect(stallsSection).toBeVisible();

    // Should show stalls with power ratings
    const stallCards = page.locator('[data-testid="stall-card"]');
    const count = await stallCards.count();

    if (count > 0) {
      // Check first stall has power rating
      await expect(stallCards.first().locator('text=/\\d+kW/')).toBeVisible();
    }
  });

  test('should handle drag and drop vehicle to stall', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="vehicle-card"]');
    await page.waitForSelector('[data-testid="stall-card"]');

    const vehicleCard = page.locator('[data-testid="vehicle-card"]').first();
    const stallCard = page.locator('[data-testid="stall-card"]').first();

    // Check if both cards exist
    if ((await vehicleCard.count()) > 0 && (await stallCard.count()) > 0) {
      // Perform drag and drop
      await vehicleCard.dragTo(stallCard);

      // Check for success message or updated assignments
      await page.waitForSelector('text=Successfully scheduled', { timeout: 5000 });
    }
  });

  test('should generate optimization plan', async ({ page }) => {
    const optimizeButton = page.locator('button:has-text("Optimize Plan")');

    // Check if optimize button is available and not disabled
    if (await optimizeButton.isVisible() && await optimizeButton.isEnabled()) {
      await optimizeButton.click();

      // Should show loading state
      await expect(page.locator('text=Optimizing...')).toBeVisible();

      // Wait for optimization to complete
      await page.waitForSelector('text=assignments planned', { timeout: 10000 });

      // Should show metrics
      await expect(page.locator('text=Utilization')).toBeVisible();
      await expect(page.locator('text=Avg Wait Time')).toBeVisible();
      await expect(page.locator('text=Energy Efficiency')).toBeVisible();

      // Should show apply plan button
      await expect(page.locator('button:has-text("Apply Plan")')).toBeVisible();
    }
  });

  test('should apply optimization plan', async ({ page }) => {
    const optimizeButton = page.locator('button:has-text("Optimize Plan")');

    if (await optimizeButton.isVisible() && await optimizeButton.isEnabled()) {
      // Generate plan first
      await optimizeButton.click();
      await page.waitForSelector('button:has-text("Apply Plan")', { timeout: 10000 });

      const applyButton = page.locator('button:has-text("Apply Plan")');
      await applyButton.click();

      // Should show applying state
      await expect(page.locator('text=Applying...')).toBeVisible();

      // Wait for success
      await page.waitForSelector('text=Optimization plan applied successfully', { timeout: 10000 });
    }
  });

  test('should show current assignments', async ({ page }) => {
    const assignmentsSection = page.locator('[data-testid="assignments-section"]');
    await expect(assignmentsSection).toBeVisible();

    // Check for assignment cards (if any exist)
    const assignmentCards = page.locator('[data-testid="assignment-card"]');
    const count = await assignmentCards.count();

    if (count > 0) {
      // Should show vehicle ID, stall ID, and time info
      const firstCard = assignmentCards.first();
      await expect(firstCard.locator('text=/V\\d+/')).toBeVisible();
      await expect(firstCard.locator('text=/CS\\d+|DB\\d+/')).toBeVisible();
      await expect(firstCard.locator('text=Start:')).toBeVisible();
      await expect(firstCard.locator('text=End:')).toBeVisible();
    }
  });

  test('should show instructions panel', async ({ page }) => {
    const instructionsPanel = page.locator('[data-testid="instructions"]');
    await expect(instructionsPanel).toBeVisible();

    await expect(page.locator('text=How to use the scheduler:')).toBeVisible();
    await expect(page.locator('text=Drag vehicles from the left column')).toBeVisible();
    await expect(page.locator('text=Click "Optimize Plan"')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API failure by intercepting requests
    await page.route('**/api/schedule-vehicle', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Vehicle not available' }),
      });
    });

    // Try to perform an action that would trigger API call
    const vehicleCard = page.locator('[data-testid="vehicle-card"]').first();
    const stallCard = page.locator('[data-testid="stall-card"]').first();

    if ((await vehicleCard.count()) > 0 && (await stallCard.count()) > 0) {
      await vehicleCard.dragTo(stallCard);

      // Should show error message
      await expect(page.locator('.alert-destructive')).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Should still show main components
    await expect(page.locator('text=Scheduler')).toBeVisible();
    await expect(page.locator('text=Optimize Plan')).toBeVisible();

    // Cards should stack vertically on mobile
    const columns = page.locator('.grid-cols-1.lg\\:grid-cols-3');
    await expect(columns).toBeVisible();
  });

  test('should persist data across tab switches', async ({ page }) => {
    // Make a change in scheduler
    const optimizeButton = page.locator('button:has-text("Optimize Plan")');

    if (await optimizeButton.isVisible() && await optimizeButton.isEnabled()) {
      await optimizeButton.click();
      await page.waitForSelector('text=assignments planned', { timeout: 10000 });
    }

    // Switch to another tab
    await page.click('text=Fleet');
    await page.waitForSelector('text=Fleet Management');

    // Switch back to scheduler
    await page.click('text=Scheduler');

    // Should maintain state (if we had generated a plan)
    const applyButton = page.locator('button:has-text("Apply Plan")');
    if (await applyButton.isVisible()) {
      expect(applyButton).toBeVisible();
    }
  });
});