import { test, expect } from './axe-test';

const paths = [
  '/',
  '/resources/costs',
  '/about/overview',
];

for (const path of paths) {
  test(path, async ({ page, makeAxeBuilder }) => {
    await page.goto(path);
    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  });
}
