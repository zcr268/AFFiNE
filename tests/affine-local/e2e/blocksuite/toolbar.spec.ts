import { test } from '@affine-test/kit/playwright';
import { locateFormatBar } from '@affine-test/kit/utils/editor';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import {
  clickNewPageButton,
  waitForEmptyEditor,
} from '@affine-test/kit/utils/page-logic';
import { expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await openHomePage(page);
  await clickNewPageButton(page);
  await waitForEmptyEditor(page);
});

test.describe('Formatting', () => {
  test('should change text color', async ({ page }) => {
    await page.keyboard.press('Enter');

    await page.keyboard.type('hello world');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');

    const formatBar = locateFormatBar(page);
    await formatBar.locator('.highlight-icon').hover();
    const fgGreenButton = formatBar.locator(
      '[data-testid="var(--affine-text-highlight-foreground-green)"]'
    );
    await fgGreenButton.click();
    const fgColor1 = await fgGreenButton
      .locator('span')
      .evaluate(e => window.getComputedStyle(e).getPropertyValue('color'));

    const paragraph = page.locator('affine-paragraph');
    const textSpan = paragraph
      .locator('affine-text:has-text("rld")')
      .locator('span')
      .first();
    await expect(textSpan).toBeVisible();
    const fgColor2 = await textSpan.evaluate(e =>
      window.getComputedStyle(e).getPropertyValue('color')
    );

    expect(fgColor1).toBe(fgColor2);
  });

  test('should change text background color', async ({ page }) => {
    await page.keyboard.press('Enter');

    await page.keyboard.type('hello world');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');

    const formatBar = locateFormatBar(page);
    await formatBar.locator('.highlight-icon').hover();

    const fgGreenButton = formatBar.locator(
      '[data-testid="var(--affine-text-highlight-foreground-green)"]'
    );
    await fgGreenButton.click();
    const fgColor1 = await fgGreenButton
      .locator('span')
      .evaluate(e => window.getComputedStyle(e).getPropertyValue('color'));

    const paragraph = page.locator('affine-paragraph');
    const textSpan1 = paragraph
      .locator('affine-text:has-text("rld")')
      .locator('span')
      .first();
    const fgColor2 = await textSpan1.evaluate(e =>
      window.getComputedStyle(e).getPropertyValue('color')
    );

    expect(fgColor1).toBe(fgColor2);

    await page.keyboard.press('ArrowRight');

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+ArrowLeft');
    }

    await formatBar.locator('.highlight-icon').hover();

    const yellow = 'var(--affine-text-highlight-yellow)';
    const bgYellowButton = formatBar.locator(`[data-testid="${yellow}"]`);
    await bgYellowButton.click();

    const textSpan2 = paragraph
      .locator('affine-text:has-text("wo")')
      .locator('span')
      .first();

    await expect(textSpan2).toBeVisible();

    const bgColor1 = await textSpan1.evaluate(e => e.style.backgroundColor);

    const bgColor2 = await textSpan2.evaluate(e => e.style.backgroundColor);

    expect(yellow).toBe(bgColor1);
    expect(yellow).toBe(bgColor2);
  });
});
