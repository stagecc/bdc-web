import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

/**
 * Extended Playwright test with a shared AxeBuilder factory.
 *
 * Tags: WCAG 2.0 + 2.1 at Levels A and AA (Section 508 compliance).
 * Excluded elements:
 *   - iframe: axe cannot inject into cross-origin iframes (e.g. YouTube embeds),
 *     and their internal markup (e.g. YouTube player) can produce false positives.
 */
export const test = base.extend<A11yFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('iframe'),
    );
  },
});

export { expect };
