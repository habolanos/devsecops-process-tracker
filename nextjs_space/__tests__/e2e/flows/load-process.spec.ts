import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Load Process Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
  });

  test('should load process from template and display tasks', async ({ page }) => {
    // Click on first template (IT Security Audit)
    const firstTemplate = page.locator('[data-testid="process-template"]').first();
    await expect(firstTemplate).toBeVisible();
    
    await firstTemplate.click();
    
    // Wait for navigation to /process
    await page.waitForURL('/process');
    
    // Verify process name is displayed
    await expect(page.locator('h1')).toContainText('Auditoría');
    
    // Verify sidebar with phases is visible
    await expect(page.locator('[data-testid="process-sidebar"]')).toBeVisible();
    
    // Verify at least one task card is visible
    await expect(page.locator('[data-testid="task-card"]').first()).toBeVisible();
    
    // Verify progress bar is displayed
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test('should upload YAML file and load process', async ({ page }) => {
    // Create a test YAML file content
    const yamlContent = `
process:
  id: test-yaml
  name: Test YAML Process
  description: Process loaded from YAML
  version: "1.0.0"
  phases:
    - id: phase-1
      name: Test Phase
      tasks:
        - id: task-1
          name: Test Task
          evidence:
            type: text
            required: false
`;

    // Create a file to upload
    const fileInput = page.locator('input[type="file"][accept=".yaml,.yml"]');
    
    // Set file using setInputFiles
    await fileInput.setInputFiles({
      name: 'test-process.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(yamlContent)
    });
    
    // Wait for navigation
    await page.waitForURL('/process', { timeout: 15000 });
    
    // Verify loaded process name
    await expect(page.locator('h1')).toContainText('Test YAML Process');
    
    // Verify phase is visible
    await expect(page.locator('text=Test Phase')).toBeVisible();
  });

  test('should display error for invalid YAML', async ({ page }) => {
    const invalidYaml = 'invalid yaml content: [';
    
    const fileInput = page.locator('input[type="file"][accept=".yaml,.yml"]');
    
    await fileInput.setInputFiles({
      name: 'invalid.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(invalidYaml)
    });
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('error');
    
    // Should stay on home page
    expect(page.url()).toContain('/');
  });

  test('should import JSON and restore process state', async ({ page }) => {
    const exportData = {
      process: {
        id: 'imported-test',
        name: 'Imported Process',
        description: 'Previously exported',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0.5,
        phases: [
          {
            id: 'p1',
            name: 'Phase 1',
            description: 'First phase',
            order: 1,
            progress: 0.5,
            tasks: [
              {
                id: 't1',
                name: 'Task 1',
                description: 'First task',
                order: 1,
                completed: true,
                completedAt: '2024-01-01T10:00:00Z',
                evidence: {
                  text: 'Evidence text',
                  images: []
                }
              },
              {
                id: 't2',
                name: 'Task 2',
                description: 'Second task',
                order: 2,
                completed: false,
                evidence: {
                  images: []
                }
              }
            ]
          }
        ]
      }
    };

    const fileInput = page.locator('input[type="file"][accept=".json"]');
    
    await fileInput.setInputFiles({
      name: 'process-export.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(exportData))
    });
    
    // Wait for navigation
    await page.waitForURL('/process', { timeout: 15000 });
    
    // Verify imported state
    await expect(page.locator('h1')).toContainText('Imported Process');
    
    // Verify completed task shows correct status
    const firstTask = page.locator('[data-testid="task-card"]').first();
    await expect(firstTask).toContainText('Completada');
    
    // Verify progress bar shows 50%
    await expect(page.locator('[data-testid="progress-bar"]')).toContainText('50%');
  });
});
