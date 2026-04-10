import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
        // Navigate to login page
        await page.goto('/');

        // Wait for login form
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // Fill login form
        await page.fill('input[type="email"]', 'admin@sibm.ci');
        await page.fill('input[type="password"]', 'admin123');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL(/\/dashboard/);

        // Verify user is logged in
        await expect(page.locator('text=Tableau de bord')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=/invalide|incorrect/i')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.fill('input[type="email"]', 'admin@sibm.ci');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);

        // Logout
        await page.click('button:has-text("Déconnexion"), button:has-text("Logout")');

        // Should redirect to login
        await page.waitForURL('/');
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });
});

test.describe('Ticket Creation Flow (Entry)', () => {
    test.beforeEach(async ({ page }) => {
        // Login as AGENT_GUERITE
        await page.goto('/');
        await page.fill('input[type="email"]', 'guerite@sibm.ci');
        await page.fill('input[type="password"]', 'guerite123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('should create a new ticket successfully', async ({ page }) => {
        // Navigate to Entry page
        await page.goto('/entry');

        // Fill ticket form
        await page.fill('input[name="licensePlate"]', 'AB-123-CD');
        await page.fill('input[name="driverName"]', 'Test Driver');
        await page.fill('input[name="driverPhone"]', '+225 01 02 03 04 05');
        await page.fill('input[name="orderNumber"]', 'ORD-TEST-001');

        // Select category
        await page.click('text=CIMENT');

        // Submit form
        await page.click('button:has-text("Créer"), button:has-text("Enregistrer")');

        // Should show success message or QR code
        await expect(page.locator('text=/succès|créé|QR/i')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Ticket Workflow (Operational Dashboard)', () => {
    test.beforeEach(async ({ page }) => {
        // Login as AGENT_QUAI
        await page.goto('/');
        await page.fill('input[type="email"]', 'quai@sibm.ci');
        await page.fill('input[type="password"]', 'quai123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('should call a waiting ticket', async ({ page }) => {
        // Navigate to operational dashboard
        await page.goto('/dashboard/control');

        // Wait for tickets to load
        await page.waitForSelector('text=EN_ATTENTE, text=Waiting', { timeout: 5000 }).catch(() => { });

        // Click on first "Call" button if available
        const callButton = page.locator('button:has-text("Appeler"), button:has-text("Call")').first();

        if (await callButton.isVisible()) {
            await callButton.click();

            // Should show ticket as called
            await expect(page.locator('text=/APPELÉ|Called/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should start loading a called ticket', async ({ page }) => {
        await page.goto('/dashboard/control');

        // Wait for called tickets
        await page.waitForTimeout(1000);

        // Click "Start Loading" button if available
        const startButton = page.locator('button:has-text("Démarrer"), button:has-text("Start")').first();

        if (await startButton.isVisible()) {
            await startButton.click();

            // Should show ticket in loading state
            await expect(page.locator('text=/CHARGEMENT|Loading/i')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Reporting Access', () => {
    test('should access reporting page as manager', async ({ page }) => {
        // Login as MANAGER
        await page.goto('/');
        await page.fill('input[type="email"]', 'manager@sibm.ci');
        await page.fill('input[type="password"]', 'manager123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);

        // Navigate to reporting
        await page.goto('/reporting');

        // Should show reporting data
        await expect(page.locator('text=/Rapports|Reports|Statistiques/i')).toBeVisible();
        await expect(page.locator('text=/Volume|Tickets/i')).toBeVisible();
    });
});
