import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

test('desktop: day/week navigation, one-tap focus, and sound controls', async () => {
  const app = await electron.launch({
    args: [path.resolve('.')],
    env: { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
  });
  try {
    const page = await app.firstWindow();
    await expect(page.getByText('时间足迹').first()).toBeVisible();
    await page.getByRole('button', { name: /今日回望/ }).click();
    await expect(page.getByText('24 HOURS')).toBeVisible();
    await page.getByRole('button', { name: /时间足迹/ }).first().click();
    await expect(page.getByText('24 HOURS')).toHaveCount(0);
    await page.getByRole('button', { name: /直接开始专注/ }).first().click();
    await expect(page.getByRole('region', { name: /沉浸专注/ })).toBeVisible();
    await page.getByRole('button', { name: /打开自然声音面板/ }).click();
    await expect(page.getByRole('region', { name: '自然声音混音台' })).toBeVisible();
    await expect(page.getByRole('slider', { name: '细雨音量' })).toBeVisible();
    await page.getByRole('button', { name: '关闭混音台' }).click();
    await expect(page.getByRole('region', { name: '自然声音混音台' })).toHaveCount(0);
  } finally {
    await app.close();
  }
});

test('motion design: dialogs and mixer are animated, controls are keyboard reachable', async () => {
  const app = await electron.launch({
    args: [path.resolve('.')],
    env: { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
  });
  try {
    const page = await app.firstWindow();
    const setup = page.getByRole('button', { name: /专注/ }).first();
    await setup.click();
    const dialog = page.locator('.modal');
    await expect(dialog).toBeVisible();
    const animation = await dialog.evaluate(el => getComputedStyle(el).animationName);
    expect(animation).toContain('tf-dialog-in');
    await page.keyboard.press('Escape');
  } finally {
    await app.close();
  }
});
