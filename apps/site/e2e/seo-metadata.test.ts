import { expect, test } from '@playwright/test';

const siteOrigin = 'https://biodatacatalyst.nhlbi.nih.gov';
const defaultDescription =
  'NHLBI BioData Catalyst is a cloud-based ecosystem that helps researchers find, access, share, store, and analyze biomedical data in secure workspaces.';

function canonicalPattern(pathname: string) {
  return new RegExp(`^${siteOrigin}${pathname}/?$`);
}

test('article pages render article SEO tags in the document head', async ({
  page,
}) => {
  await page.goto('/news/latest-updates/2021/08/welcome', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page).toHaveTitle(
    'NHLBI BioData Catalyst welcomes all researchers',
  );
  await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute(
    'content',
    'article',
  );
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    'content',
    'NHLBI BioData Catalyst welcomes all researchers',
  );
  await expect(page.locator('head meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    'NHLBI BioData Catalyst welcomes all researchers',
  );
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    /The NHLBI BioData Catalyst announced today that its ecosystem, which has undergone rigorous\s+pilot testing, is now open to all researchers\./,
  );
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    'href',
    canonicalPattern('/news/latest-updates/2021/08/welcome'),
  );
});

test('landing pages reuse shared and hero SEO descriptions', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    defaultDescription,
  );

  await page.goto('/help/contact-and-support', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    'Find technical help, documentation, live support, or the right contact for your question.',
  );
  await expect(
    page.locator('head meta[property="og:description"]'),
  ).toHaveAttribute(
    'content',
    'Find technical help, documentation, live support, or the right contact for your question.',
  );
});

test('event pages include event summaries in SEO descriptions', async ({
  page,
}) => {
  await page.goto('/news/events/2026/08/community-hours', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    'For the first time, National Sleep Research Resource (NSRR) harmonized data are available on BDC, with more harmonized datasets to come. NSRR brings together extensive sleep-related datasets collected across multiple cohorts and clinical studies, including polysomnography, actigraphy, and questionnaire-based data representing tens of thousands of participants.',
  );
  await expect(
    page.locator('head meta[property="og:description"]'),
  ).toHaveAttribute(
    'content',
    'For the first time, National Sleep Research Resource (NSRR) harmonized data are available on BDC, with more harmonized datasets to come. NSRR brings together extensive sleep-related datasets collected across multiple cohorts and clinical studies, including polysomnography, actigraphy, and questionnaire-based data representing tens of thousands of participants.',
  );
});

test('search page renders noindex SEO tags in the document head', async ({
  page,
}) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle('Search Results | BioData Catalyst');
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );
  await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute(
    'content',
    'website',
  );
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
    'content',
    defaultDescription,
  );
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    'href',
    canonicalPattern('/search'),
  );
});

test('404 responses still render expected head tags', async ({ page }) => {
  const response = await page.goto('/this-route-should-404', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page Not Found | BioData Catalyst');
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,follow',
  );
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Page Not Found',
  );
  await expect(page.locator('head meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    'Page Not Found',
  );
});
