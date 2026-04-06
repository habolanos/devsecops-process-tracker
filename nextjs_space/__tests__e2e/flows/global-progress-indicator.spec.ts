import { test, expect } from '@playwright/test';

test.describe('Global Progress Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show progress indicator when loading a template', async ({ page }) => {
    // Wait for templates to load
    await page.waitForSelector('[data-testid="process-template"]', { timeout: 10000 });
    
    // Click on a template
    await page.click('[data-testid="process-template"]');
    
    // Check if progress indicator appears
    const progressBar = page.locator('.bg-blue-500.h-1');
    await expect(progressBar).toBeVisible({ timeout: 5000 });
    
    // Wait for navigation to complete
    await page.waitForURL('/process', { timeout: 10000 });
    
    // Progress indicator should disappear
    await expect(progressBar).not.toBeVisible({ timeout: 5000 });
  });

  test('should show progress indicator when uploading YAML file', async ({ page }) => {
    // Upload a YAML file
    const fileInput = page.locator('#yaml-upload');
    const progressBar = page.locator('.bg-blue-500.h-1');
    
    // Create a mock YAML file
    const yamlContent = `
name: Test Process
version: 1.0.0
description: Test process for progress indicator
phases:
  - id: phase-1
    name: Phase 1
    description: Test phase
    order: 1
    tasks: []
    progress: 0
    dynamicLinks: []
    activities: []
`;
    
    // Upload file
    await fileInput.setInputFiles({
      name: 'test.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(yamlContent)
    });
    
    // Check if progress indicator appears
    await expect(progressBar).toBeVisible({ timeout: 5000 });
    
    // Wait for navigation
    await page.waitForURL('/process', { timeout: 10000 });
    
    // Progress indicator should disappear
    await expect(progressBar).not.toBeVisible({ timeout: 5000 });
  });

  test('should show progress indicator when exporting to JSON', async ({ page }) => {
    // First load a process
    await page.goto('/');
    await page.waitForSelector('[data-testid="process-template"]', { timeout: 10000 });
    await page.click('[data-testid="process-template"]');
    await page.waitForURL('/process', { timeout: 10000 });
    
    // Click export JSON button
    const exportButton = page.locator('[data-testid="export-json-btn"]');
    const progressBar = page.locator('.bg-blue-500.h-1');
    
    await exportButton.click();
    
    // Check if progress indicator appears
    await expect(progressBar).toBeVisible({ timeout: 5000 });
    
    // Wait for download to complete (button becomes enabled again)
    await expect(exportButton).toBeEnabled({ timeout: 10000 });
    
    // Progress indicator should disappear
    await expect(progressBar).not.toBeVisible({ timeout: 5000 });
  });

  test('should show progress indicator when exporting to Word', async ({ page }) => {
    // First load a process
    await page.goto('/');
    await page.waitForSelector('[data-testid="process-template"]', { timeout: 10000 });
    await page.click('[data-testid="process-template"]');
    await page.waitForURL('/process', { timeout: 10000 });
    
    // Click export Word button
    const exportButton = page.locator('[data-testid="export-word-btn"]');
    const progressBar = page.locator('.bg-blue-500.h-1');
    
    await exportButton.click();
    
    // Check if progress indicator appears
    await expect(progressBar).toBeVisible({ timeout: 5000 });
    
    // Wait for download to complete
    await expect(exportButton).toBeEnabled({ timeout: 10000 });
    
    // Progress indicator should disappear
    await expect(progressBar).not.toBeVisible({ timeout: 5000 });
  });

  test('should not show progress indicator when no operation is in progress', async ({ page }) => {
    const progressBar = page.locator('.bg-blue-500.h-1');
    
    // Progress indicator should not be visible on initial load
    await expect(progressBar).not.toBeVisible();
  });

  test('should have correct styling and positioning', async ({ page }) => {
    // Trigger a loading operation
    await page.waitForSelector('[data-testid="process-template"]', { timeout: 10000 });
    await page.click('[data-testid="process-template"]');
    
    const progressBar = page.locator('.bg-blue-500.h-1');
    await expect(progressBar).toBeVisible();
    
    // Check styling
    await expect(progressBar).toHaveCSS('position', 'fixed');
    await expect(progressBar).toHaveCSS('top', '0px');
    await expect(progressBar).toHaveCSS('left', '0px');
    await expect(progressBar).toHaveCSS('right', '0px');
    await expect(progressBar).toHaveCSS('z-index', '9999');
    
    // Check height
    const box = await progressBar.boundingBox();
    if (box) {
      expect(box.height).toBe(2); // h-0.5 is 2px
    }
  });
});
