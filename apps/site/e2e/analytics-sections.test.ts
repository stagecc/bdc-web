import { expect, test } from '@playwright/test';

// Use multiple real pages that currently render InPageNav so one editorial or
// layout change does not remove all browser-level coverage for this analytics
// root. If one of these pages intentionally stops using InPageNav, replace it
// with another real route that still renders the shared component.
const inPageNavRoutes = ['/data/analyze/', '/about/research-communities'];

test('homepage renders header and footer analytics sections exactly once', async ({
  page,
}) => {
  await page.goto('/');

  const header = page.locator('[data-analytics-section="header"]');
  const footer = page.locator('[data-analytics-section="footer"]');

  await expect(header).toHaveCount(1);
  await expect(header).toHaveAttribute('data-analytics-section', 'header');

  await expect(footer).toHaveCount(1);
  await expect(footer).toHaveAttribute('data-analytics-section', 'footer');
});

for (const route of inPageNavRoutes) {
  test(`${route} renders in-page-nav analytics section`, async ({ page }) => {
    await page.goto(route);

    const inPageNav = page.locator('[data-analytics-section="in_page_nav"]');

    await expect(
      inPageNav,
      `Expected ${route} to render InPageNav. If this page intentionally stopped using InPageNav, update this test to use a different real route that still renders it.`,
    ).toHaveCount(1);
    await expect(
      inPageNav,
      `Expected ${route} to keep data-analytics-section="in_page_nav" on the rendered InPageNav root.`,
    ).toHaveAttribute('data-analytics-section', 'in_page_nav');
  });
}
