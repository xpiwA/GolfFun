import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests/browser',
    timeout: 45000,
    expect: { timeout: 10000 },
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:9400',
        viewport: { width: 1440, height: 1000 },
        launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
});
