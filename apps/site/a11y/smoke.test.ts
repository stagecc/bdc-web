import { expect, test } from './axe-test';

const paths = [
  '/',
  '/resources/costs',
  '/about/overview',
  '/data/explore/dug/',
  '/help/terms/',
  '/news/events/',
  '/news/events/archive/',
  '/news/latest-updates/',
  '/tagged/community%20hours/',
];

for (const path of paths) {
  test(path, async ({ page, makeAxeBuilder }) => {
    await page.goto(path);
    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  });
}
