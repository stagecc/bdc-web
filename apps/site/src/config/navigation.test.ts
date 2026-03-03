import { describe, expect, it } from 'vitest';
import { navConfig } from './navigation';

const allSubItems = navConfig.flatMap((item) => item.items ?? []);

describe('navConfig', () => {
  it('every top-level item has a label', () => {
    for (const item of navConfig) {
      expect(item.label).toBeTruthy();
    }
  });

  it('every sub-item has a label and href', () => {
    for (const sub of allSubItems) {
      expect(sub.label).toBeTruthy();
      expect(sub.href).toBeTruthy();
    }
  });

  it('external links use absolute URLs', () => {
    const externalItems = allSubItems.filter((sub) => sub.external);
    expect(externalItems.length).toBeGreaterThan(0);
    for (const sub of externalItems) {
      expect(sub.href).toMatch(/^https?:\/\//);
    }
  });

  it('internal links use relative paths', () => {
    const internalItems = allSubItems.filter((sub) => !sub.external);
    for (const sub of internalItems) {
      expect(sub.href).toMatch(/^\//);
    }
  });

  it('has no duplicate hrefs', () => {
    const hrefs = allSubItems.map((sub) => sub.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
