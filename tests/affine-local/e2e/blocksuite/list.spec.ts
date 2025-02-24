import { test } from '@affine-test/kit/playwright';
import {
  pressArrowUp,
  pressEnter,
  pressTab,
} from '@affine-test/kit/utils/keyboard';
import { openHomePage } from '@affine-test/kit/utils/load-page';
import {
  clickNewPageButton,
  type,
  waitForEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import { expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await openHomePage(page);
  await clickNewPageButton(page, 'List Test');
  await waitForEditorLoad(page);
});

test.describe('split list', () => {
  test('split at the start of the list', async ({ page }) => {
    await pressEnter(page);
    await type(page, '1. aaa\nbbb\nccc\nddd');
    await pressArrowUp(page, 2);
    await pressTab(page);
    await pressArrowUp(page, 2);

    const listLocator = page.locator('affine-list');

    /**
     * 1. |aaa
     *   a. bbb
     * 2. ccc
     * 3. ddd
     */
    await expect(listLocator.nth(0).locator('rich-text')).toHaveText([
      'aaa',
      'bbb',
    ]);
    await expect(
      listLocator.nth(0).locator('.affine-list-block__numbered')
    ).toHaveText(['1.', 'a.']);
    await expect(listLocator.nth(2).locator('rich-text')).toHaveText('ccc');
    await expect(
      listLocator.nth(2).locator('.affine-list-block__numbered')
    ).toHaveText('2.');
    await expect(listLocator.nth(3).locator('rich-text')).toHaveText('ddd');
    expect(
      listLocator.nth(3).locator('.affine-list-block__numbered')
    ).toHaveText('3.');

    await pressEnter(page);
    /**
     * 1.
     * 2. aaa
     *   a. bbb
     * 3. ccc
     * 4. ddd
     */
    await expect(
      listLocator.nth(0).locator('.affine-list-block__numbered')
    ).toHaveText('1.');
    await expect(listLocator.nth(1).locator('rich-text')).toHaveText([
      'aaa',
      'bbb',
    ]);
    await expect(
      listLocator.nth(1).locator('.affine-list-block__numbered')
    ).toHaveText(['2.', 'a.']);
    await expect(listLocator.nth(3).locator('rich-text')).toHaveText('ccc');
    await expect(
      listLocator.nth(3).locator('.affine-list-block__numbered')
    ).toHaveText('3.');
    await expect(listLocator.nth(4).locator('rich-text')).toHaveText('ddd');
    await expect(
      listLocator.nth(4).locator('.affine-list-block__numbered')
    ).toHaveText('4.');
  });
});
