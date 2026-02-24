import { expect, test } from './axe-test';

const urls = (process.env.A11Y_URLS ?? '').split(/\s+/).filter(Boolean);

test.describe('page accessibility', () => {
  if (urls.length === 0) {
    test('requires URLs', () => {
      throw new Error(
        'No URLs to test. Pass one or more URLs as arguments:\n' +
          '  npm run a11y:page -w @bdc/site -- http://localhost:4321/about/overview',
      );
    });
    return;
  }

  for (const url of urls) {
    test(url, async ({ page, makeAxeBuilder }) => {
      await page.goto(url);
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
