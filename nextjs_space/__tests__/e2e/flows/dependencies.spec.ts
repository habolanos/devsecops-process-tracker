import { test, expect } from '@playwright/test';

test.describe('Task Dependencies Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Load a process with dependencies
    await page.goto('/');
    
    const yamlContent = `
process:
  id: deps-test
  name: Dependencies Test
  phases:
    - id: phase-1
      name: Phase 1
      tasks:
        - id: task-a
          name: Task A (No deps)
          evidence:
            type: text
            required: false
        - id: task-b
          name: Task B (Depends on A)
          evidence:
            type: text
            required: false
          dependencies: ["task-a"]
        - id: task-c
          name: Task C (Depends on B)
          evidence:
            type: text
            required: false
          dependencies: ["task-b"]
`;

    const fileInput = page.locator('input[type="file"][accept=".yaml,.yml"]');
    await fileInput.setInputFiles({
      name: 'deps-process.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(yamlContent)
    });
    
    await page.waitForURL('/process', { timeout: 15000 });
  });

  test('should display blocked status for tasks with uncompleted dependencies', async ({ page }) => {
    // Task A should be unblocked (no deps)
    const taskA = page.locator('[data-task-id="task-a"]');
    await expect(taskA).not.toContainText('Bloqueada');
    await expect(taskA.locator('[data-testid="task-checkbox"]')).toBeEnabled();
    
    // Task B should be blocked (depends on incomplete Task A)
    const taskB = page.locator('[data-task-id="task-b"]');
    await expect(taskB).toContainText('Bloqueada');
    await expect(taskB.locator('[data-testid="lock-icon"]')).toBeVisible();
    await expect(taskB.locator('[data-testid="task-checkbox"]')).toBeDisabled();
    
    // Task C should also be blocked (depends on B)
    const taskC = page.locator('[data-task-id="task-c"]');
    await expect(taskC).toContainText('Bloqueada');
  });

  test('should unblock dependent task when dependency is completed', async ({ page }) => {
    // Complete Task A
    const taskA = page.locator('[data-task-id="task-a"]');
    await taskA.locator('[data-testid="task-checkbox"]').click();
    
    // Task B should now be unblocked
    const taskB = page.locator('[data-task-id="task-b"]');
    await expect(taskB).not.toContainText('Bloqueada');
    await expect(taskB.locator('[data-testid="lock-icon"]')).not.toBeVisible();
    await expect(taskB.locator('[data-testid="task-checkbox"]')).toBeEnabled();
    
    // Complete Task B
    await taskB.locator('[data-testid="task-checkbox"]').click();
    
    // Task C should now be unblocked
    const taskC = page.locator('[data-task-id="task-c"]');
    await expect(taskC).not.toContainText('Bloqueada');
  });

  test('should block dependent tasks when dependency is uncompleted', async ({ page }) => {
    // Complete tasks in order
    await page.locator('[data-task-id="task-a"] [data-testid="task-checkbox"]').click();
    await page.locator('[data-task-id="task-b"] [data-testid="task-checkbox"]').click();
    
    // Verify Task C is unblocked
    const taskC = page.locator('[data-task-id="task-c"]');
    await expect(taskC).not.toContainText('Bloqueada');
    
    // Uncomplete Task A
    await page.locator('[data-task-id="task-a"] [data-testid="task-checkbox"]').click();
    
    // Verify cascade: B and C should be re-blocked
    await expect(page.locator('[data-task-id="task-b"]')).toContainText('Bloqueada');
    await expect(page.locator('[data-task-id="task-c"]')).toContainText('Bloqueada');
  });

  test('should show alert when trying to complete blocked task', async ({ page }) => {
    // Listen for alert
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('evidencia');
      await dialog.accept();
    });
    
    // Try to click blocked task checkbox
    const taskB = page.locator('[data-task-id="task-b"]');
    await taskB.locator('[data-testid="task-checkbox"]').click({ force: true });
  });

  test('should display dependency list on task card', async ({ page }) => {
    const taskB = page.locator('[data-task-id="task-b"]');
    
    // Verify dependency label is shown
    await expect(taskB.locator('text=Dependencias')).toBeVisible();
    await expect(taskB.locator('text=task-a')).toBeVisible();
  });
});
