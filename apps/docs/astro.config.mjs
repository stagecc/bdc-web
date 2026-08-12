import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { sidebar } from './src/config/sidebar.generated.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');
const externalSidebar = filterSidebarByExistingSlugs(
  loadExternalSidebar(join(rootDir, 'src/generated/external-sidebar.json')),
  rootDir,
);

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
      sidebar: [...sidebar, ...externalSidebar],
    }),
  ],
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
