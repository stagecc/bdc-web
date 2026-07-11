import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StarlightUserConfig } from '@astrojs/starlight/types';
import { beforeAll, describe, expect, it } from 'vitest';

type Sidebar = NonNullable<StarlightUserConfig['sidebar']>;
type SidebarItem = Sidebar[number];

const configDir = dirname(fileURLToPath(import.meta.url));
const generatedSidebarPath = join(configDir, 'sidebar.generated.ts');
const describeGeneratedSidebar = existsSync(generatedSidebarPath)
  ? describe
  : describe.skip;

async function loadSidebar(): Promise<Sidebar> {
  const generated = await import('./sidebar.generated');
  return generated.sidebar;
}

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

describeGeneratedSidebar('sidebar.generated', () => {
  let sidebar: Sidebar = [];

  beforeAll(async () => {
    sidebar = await loadSidebar();
  });

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
