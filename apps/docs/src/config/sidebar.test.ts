import { describe, expect, it } from 'vitest';
import { sidebar } from './sidebar';

type SidebarItem = (typeof sidebar)[number];

function collectSlugs(items: SidebarItem[]): string[] {
  const slugs: string[] = [];
  for (const item of items) {
    if ('slug' in item && item.slug) slugs.push(item.slug);
    if ('items' in item && Array.isArray(item.items)) {
      slugs.push(...collectSlugs(item.items as SidebarItem[]));
    }
  }
  return slugs;
}

function collectLabels(items: SidebarItem[]): string[] {
  const labels: string[] = [];
  for (const item of items) {
    labels.push(item.label);
    if ('items' in item && Array.isArray(item.items)) {
      labels.push(...collectLabels(item.items as SidebarItem[]));
    }
  }
  return labels;
}

describe('sidebar', () => {
  it('every item has a label', () => {
    const labels = collectLabels(sidebar);
    for (const label of labels) {
      expect(label).toBeTruthy();
    }
  });

  it('has no duplicate slugs', () => {
    const slugs = collectSlugs(sidebar);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('slugs use lowercase with no leading slashes', () => {
    const slugs = collectSlugs(sidebar);
    for (const slug of slugs) {
      expect(slug).toBe(slug.toLowerCase());
      expect(slug).not.toMatch(/^\//);
    }
  });
});
