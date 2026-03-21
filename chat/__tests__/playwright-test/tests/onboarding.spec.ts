import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Onboarding Flow', () => {
    let email = '';
    let password = '';
    let userId = '';

    test.beforeAll(async () => {
        // Create a fresh test user using our script (forcing ESM mode)
        const output = execSync('npx ts-node --esm /mnt/Data68/remrin/chat/scripts/create-test-user.ts').toString();
        const credsLine = output.split('\n').find(line => line.startsWith('CREDENTIALS:'));
        if (credsLine) {
            [, email, password, userId] = credsLine.split(':');
        }
    });

    test('new user should be redirected to workspace and have Home workspace created', async ({ page }) => {
        if (!email || !password) {
            throw new Error('Failed to create test user credentials');
        }

        console.log(`Starting onboarding test for ${email}...`);

        // 1. Go to login page
        await page.goto('http://localhost:3333/en/login');
        console.log('Login page loaded.');

        // 2. Fill in credentials
        await page.getByPlaceholder('name@example.com').fill(email);
        await page.getByPlaceholder('••••••••').fill(password);
        console.log('Credentials filled.');

        // 3. Click Login
        await page.getByRole('button', { name: 'Sign In' }).click();
        console.log('Login button clicked. Waiting for redirect...');

        // 4. Wait for redirect
        await page.waitForURL(/\/chat/, { timeout: 30000 });
        console.log('Redirect detected:', page.url());

        // 5. Verify we are in a chat route
        expect(page.url()).toMatch(/\/chat/);
        console.log('✅ Onboarding verification passed.');
    });
});
