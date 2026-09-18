import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { sidebar } from './src/config/sidebar.generated.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');
const externalSidebar = filterSidebarByExistingSlugs(
  loadExternalSidebar(join(rootDir, 'src/generated/external-sidebar.json')),
  rootDir,
);
const mergedSidebar = mergeExternalSidebarSections(sidebar, externalSidebar);

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Documentation',
      favicon: '/img/favicon.svg',
      logo: {
        light: './src/assets/bdc-logo-light.svg',
        dark: './src/assets/bdc-logo-dark.svg',
        alt: 'BDC logo',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/stagecc/bdc-web',
        },
      ],
      customCss: ['./src/styles/custom.scss'],
      disable404Route: true,
      sidebar: mergedSidebar,
    }),
  ],
  markdown: {
    processor: unified(),
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [uswdsPackages],
          silenceDeprecations: ['import', 'global-builtin', 'if-function'],
        },
      },
    },
  },
});

function loadExternalSidebar(filePath) {
  if (!existsSync(filePath)) return [];

  try {
    const contents = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function filterSidebarByExistingSlugs(sidebar, docsRootDir) {
  return sidebar
    .map((section) => {
      if (
        !section ||
        typeof section !== 'object' ||
        !Array.isArray(section.items)
      ) {
        return null;
      }

      const items = filterSidebarItems(section.items, docsRootDir);
      if (items.length === 0) return null;

      return {
        ...section,
        items,
      };
    })
    .filter(Boolean);
}

function filterSidebarItems(items, docsRootDir) {
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      if ('slug' in item && typeof item.slug === 'string') {
        if (!hasDocForSlug(item.slug, docsRootDir)) {
          console.warn(
            `[docs] Skipping external sidebar slug without content: ${item.slug}`,
          );
          return null;
        }

        return item;
      }

      if ('items' in item && Array.isArray(item.items)) {
        const filteredChildren = filterSidebarItems(item.items, docsRootDir);
        if (filteredChildren.length === 0) return null;
        return {
          ...item,
          items: filteredChildren,
        };
      }

      return item;
    })
    .filter(Boolean);
}

function hasDocForSlug(slug, docsRootDir) {
  const mdPath = join(docsRootDir, 'src/content/docs', `${slug}.md`);
  if (existsSync(mdPath)) return true;

  const indexPath = join(docsRootDir, 'src/content/docs', slug, 'index.md');
  return existsSync(indexPath);
}

function mergeExternalSidebarSections(baseSidebar, externalSections) {
  const merged = structuredClone(baseSidebar);

  for (const section of externalSections) {
    const parentSlug = inferParentSlugFromSection(section);
    const inserted =
      parentSlug &&
      insertSectionUnderParentSlug(merged, parentSlug, {
        label: section.label,
        collapsed: true,
        items: section.items,
      });

    if (!inserted) {
      merged.push(section);
    }
  }

  return merged;
}

function inferParentSlugFromSection(section) {
  const slugs = collectLeafSlugs(section?.items ?? []);
  if (slugs.length === 0) return null;

  const segmentSets = slugs
    .map((slug) => slug.split('/').filter(Boolean))
    .filter((segments) => segments.length > 1);
  if (segmentSets.length === 0) return null;

  const first = segmentSets[0];
  const commonPrefix = [];

  for (let index = 0; index < first.length - 1; index += 1) {
    const part = first[index];
    const allMatch = segmentSets.every((segments) => segments[index] === part);
    if (!allMatch) break;
    commonPrefix.push(part);
  }

  return commonPrefix.length > 0 ? commonPrefix.join('/') : null;
}

function collectLeafSlugs(items) {
  const slugs = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    if ('slug' in item && typeof item.slug === 'string' && item.slug.trim() !== '') {
      slugs.push(item.slug);
    }

    if ('items' in item && Array.isArray(item.items)) {
      slugs.push(...collectLeafSlugs(item.items));
    }
  }

  return slugs;
}

function insertSectionUnderParentSlug(sidebarSections, parentSlug, sectionToInsert) {
  for (const section of sidebarSections) {
    if (!section || typeof section !== 'object' || !Array.isArray(section.items)) {
      continue;
    }

    if (
      insertIntoSidebarItems(
        section.items,
        parentSlug,
        sectionToInsert,
        typeof section.label === 'string' ? section.label : null,
      )
    ) {
      return true;
    }
  }

  return false;
}

function insertIntoSidebarItems(
  items,
  parentSlug,
  sectionToInsert,
  parentGroupLabel,
) {
  const containsParentOverview = items.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      'slug' in item &&
      item.slug === parentSlug,
  );

  if (containsParentOverview) {
    if (parentGroupLabel === sectionToInsert.label) {
      items.push(...sectionToInsert.items);
      return true;
    }

    const alreadyPresent = items.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        item.label === sectionToInsert.label &&
        Array.isArray(item.items),
    );

    if (!alreadyPresent) {
      items.push(sectionToInsert);
    }

    return true;
  }

  for (const item of items) {
    if (
      item &&
      typeof item === 'object' &&
      'items' in item &&
      Array.isArray(item.items) &&
      insertIntoSidebarItems(
        item.items,
        parentSlug,
        sectionToInsert,
        typeof item.label === 'string' ? item.label : null,
      )
    ) {
      return true;
    }
  }

  return false;
}
