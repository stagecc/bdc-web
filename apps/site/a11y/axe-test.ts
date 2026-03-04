import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

/**
 * Extended Playwright test with a shared AxeBuilder factory.
 *
 * Tags: WCAG 2.0 + 2.1 at Levels A and AA (Section 508 compliance).
 * Disabled rules:
 *   - frame-tested: axe cannot inject into cross-origin iframes (e.g. YouTube embeds).
 */
export const test = base.extend<A11yFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['frame-tested']),
    );
  },
});

export { expect };
