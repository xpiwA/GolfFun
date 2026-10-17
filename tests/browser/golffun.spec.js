import { test, expect } from '@playwright/test';
import { newRound, generateHole, SCALE } from '../../assets/engine.js';

const adminURL = '/wp-admin/admin.php?page=golffun';
async function setTheme(page, theme) {
    await page.goto(adminURL);
    await page.locator(`input[name="golffun_settings[theme]"][value="${theme}"]`).check({ force: true });
    await Promise.all([
        page.waitForURL(/settings-updated=true/),
        page.getByRole('button', { name: 'Spara ändringar' }).first().click(),
    ]);
    await expect(page.locator(`input[name="golffun_settings[theme]"][value="${theme}"]`)).toBeChecked();
}

test('admin saves both themes and the frontend uses each theme', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const theme of ['forest', 'nordic']) {
        await setTheme(page, theme);
        await expect(page.locator('.gfa-theme input:checked')).toHaveValue(theme);
        await expect(page.locator('.gfa-theme-image img').first()).toHaveJSProperty('naturalWidth', 640);
        await page.goto('/');
        await expect(page.locator('.gf-game')).toHaveClass(new RegExp(`gf-${theme}`));
        await expect(page.locator('[data-ui="course-name"]')).not.toBeEmpty();
        await expect(page.locator('[data-ui="canvas"]')).toBeVisible();
        await expect(page.locator('[data-ui="message"]')).not.toContainText('kunde inte');
    }
    expect(errors).toEqual([]);
});

test('shots change the score, survive reload and expose a functional scorecard', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-action="hit"]').click();
    await expect(page.locator('[data-ui="strokes"]')).not.toHaveText('0');
    const score = await page.locator('[data-ui="strokes"]').textContent();
    const variant = await page.locator('[data-ui="variant"]').textContent();
    await page.reload();
    await expect(page.locator('[data-ui="strokes"]')).toHaveText(score);
    await expect(page.locator('[data-ui="variant"]')).toHaveText(variant);
    await page.locator('[data-action="scorecard"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.gf-score-table tbody tr')).toHaveCount(18);
    await page.getByRole('button', { name: 'Stäng dialog' }).click();
    await page.locator('[data-action="rules"]').click();
    await expect(page.getByRole('dialog')).toContainText('Svenska Golfförbundets');
});

test('a putt holes out and next-hole control advances the actual round', async ({ page }) => {
    await page.goto('/');
    const s = newRound(2), h = generateHole(2, 0);
    s.ball = { x: h.cup.x - 15, y: h.cup.y }; s.strokes = 3;
    await page.evaluate(state => localStorage.setItem('golffun-round-v1:/:0', JSON.stringify(state)), s);
    await page.reload();
    await expect(page.locator('[data-ui="club"]')).toHaveValue('putter');
    await page.locator('[data-ui="power"]').fill(String(Math.round(15 / (30 * SCALE) * 100)));
    await page.locator('[data-action="hit"]').click();
    await expect(page.locator('[data-action="hit"]')).toContainText('Nästa hål');
    await expect(page.locator('[data-ui="message"]')).toContainText('Par!');
    await page.locator('[data-action="hit"]').click();
    await expect(page.locator('[data-ui="hole"]')).toHaveText('02');
    await expect(page.locator('[data-ui="strokes"]')).toHaveText('0');
});

test('sound starts by consent, settings toggle and shuffling replaces the round', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('[data-action="music"]').click();
    await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-action="audio"]').click();
    await expect(page.locator('[data-action="audio"]')).toContainText('Ljud aktiverat');
    const variant = await page.locator('[data-ui="variant"]').textContent();
    await page.locator('[data-action="shuffle"]').click();
    await page.locator('[data-action="new-round"]').click();
    await expect(page.locator('[data-ui="variant"]')).not.toHaveText(variant);
    await expect(page.locator('[data-ui="strokes"]')).toHaveText('0');
});

test('mobile game and admin stay inside the viewport with working touch-sized controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-ui="canvas"]')).toBeVisible();
    const gameBox = await page.locator('.gf-game').boundingBox();
    expect(gameBox.width).toBeLessThanOrEqual(390);
    expect(gameBox.x).toBeGreaterThanOrEqual(0);
    await expect(page.locator('[data-action="hit"]')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(adminURL);
    await expect(page.locator('.gfa-themes')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('anonymous visitors can play but cannot access settings', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Playground auto-login is a local development feature. Suppress it to exercise WordPress's real access check.
    await context.addCookies([{ name: 'playground_auto_login_already_happened', value: '1', domain: '127.0.0.1', path: '/' }]);
    await page.goto(adminURL);
    await expect(page.locator('#golffun-settings')).toHaveCount(0);
    await page.goto('/');
    await expect(page.locator('[data-ui="canvas"]')).toBeVisible();
    await context.close();
});

test('settings require a nonce and sanitize unsupported themes', async ({ page }) => {
    await page.goto(adminURL);
    const blocked = await page.request.post('/wp-admin/options.php', {
        form: { option_page: 'golffun', action: 'update', 'golffun_settings[theme]': 'forest' },
    });
    expect(blocked.status()).toBe(403);
    const nonce = await page.locator('input[name="_wpnonce"]').inputValue();
    const saved = await page.request.post('/wp-admin/options.php', {
        form: { option_page: 'golffun', action: 'update', _wpnonce: nonce, _wp_http_referer: adminURL, 'golffun_settings[theme]': '<script>alert(1)</script>' },
    });
    expect(saved.ok()).toBe(true);
    await page.goto(adminURL);
    await expect(page.locator('input[value="nordic"]')).toBeChecked();
    await page.goto('/');
    await expect(page.locator('.gf-game')).toHaveClass(/gf-nordic/);
});
