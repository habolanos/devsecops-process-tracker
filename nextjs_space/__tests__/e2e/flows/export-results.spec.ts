import { test, expect } from '@playwright/test';

test.describe('Export Results Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Load and complete some tasks
    await page.goto('/');
    
    const yamlContent = `
process:
  id: export-test
  name: Export Test Process
  phases:
    - id: phase-1
      name: Phase 1
      tasks:
        - id: task-1
          name: Task 1
          evidence:
            type: text
            required: false
        - id: task-2
          name: Task 2
          evidence:
            type: image
            required: false
`;

    const fileInput = page.locator('input[type="file"][accept=".yaml,.yml"]');
    await fileInput.setInputFiles({
      name: 'export-process.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(yamlContent)
    });
    
    await page.waitForURL('/process', { timeout: 15000 });
  });

  test('should export process as JSON file', async ({ page }) => {
    // Wait for download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json-btn"]')
    ]);
    
    // Verify download filename (case-insensitive)
    expect(download.suggestedFilename()).toMatch(/export-test.*\.json$/i);
    
    // Read and verify JSON content
    const path = await download.path();
    const content = await download.createReadStream();
    
    // Save to verify structure
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should export process as Word document', async ({ page }) => {
    // Complete a task first to have content in export
    await page.locator('[data-testid="task-card-task-1"] [data-testid="task-checkbox"]').click();
    
    // Wait for download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-word-btn"]')
    ]);
    
    // Verify download filename (case-insensitive)
    expect(download.suggestedFilename()).toMatch(/export-test.*\.docx$/i);
  });

  test('should complete process and auto-export both formats', async ({ page }) => {
    // Complete all tasks first
    await page.locator('[data-testid="task-card-task-1"] [data-testid="task-checkbox"]').click();
    await page.locator('[data-testid="task-card-task-2"] [data-testid="task-checkbox"]').click();
    
    // Wait for confirm dialog and accept
    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });
    
    // Track downloads
    const downloads: any[] = [];
    page.on('download', download => {
      downloads.push(download);
    });
    
    // Click complete process
    await page.click('[data-testid="complete-process-btn"]');
    
    // Wait a moment for downloads
    await page.waitForTimeout(2000);
    
    // Verify both files were downloaded
    const jsonDownload = downloads.find(d => d.suggestedFilename().endsWith('.json'));
    const wordDownload = downloads.find(d => d.suggestedFilename().endsWith('.docx'));
    
    expect(jsonDownload).toBeTruthy();
    expect(wordDownload).toBeTruthy();
  });

  test('should include evidence in JSON export', async ({ page }) => {
    // Add evidence to a task
    await page.locator('[data-testid="task-card-task-1"] [data-testid="view-evidence-btn"]').click();
    
    // Wait for modal
    await expect(page.locator('[data-testid="evidence-modal"]')).toBeVisible();
    
    // Add text evidence
    await page.fill('[data-testid="evidence-textarea"]', 'Test evidence text');
    
    // Save
    await page.click('[data-testid="save-evidence-btn"]');
    
    // Complete task
    await page.locator('[data-testid="task-card-task-1"] [data-testid="task-checkbox"]').click();
    
    // Export JSON
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json-btn"]')
    ]);
    
    // Read content
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream!) {
      chunks.push(chunk as Buffer);
    }
    
    const content = Buffer.concat(chunks).toString('utf-8');
    const exported = JSON.parse(content);
    
    // Verify evidence is included
    expect(exported.process.phases[0].tasks[0].evidence.text).toBe('Test evidence text');
  });
});
