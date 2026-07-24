import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import favicons from 'astro-favicons';
import robotsTxt from 'astro-robots-txt';
import { loadEnv } from 'vite';

const siteUrl = process.env.SITE_URL || 'https://biodatacatalyst.nhlbi.nih.gov';

const rootDir = dirname(fileURLToPath(import.meta.url));
Object.assign(process.env, loadEnv('', rootDir, ''));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

const robotsTxtConfig = {
  policy: [
    {
      userAgent: '*',
      disallow: '/',
    },
  ],
};

function externalLinks() {
  return (tree) => {
    tree.children?.forEach(function walk(node) {
      if (
        node.tagName === 'a' &&
        typeof node.properties?.href === 'string' &&
        (node.properties.href.startsWith('http://') ||
          node.properties.href.startsWith('https://'))
      ) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
        node.properties.className = [
          ...(Array.isArray(node.properties.className)
            ? node.properties.className
            : []),
          'usa-link',
          'usa-link--external',
        ];
      }
      node.children?.forEach(walk);
    });
  };
}

export default defineConfig({
  site: siteUrl,
  integrations: [
    mdx(),
    react(),
    sitemap(),
    favicons(),
    robotsTxt(robotsTxtConfig),
  ],
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [externalLinks],
  },
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', '@trussworks/react-uswds'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [uswdsPackages],
          silenceDeprecations: ['import', 'global-builtin', 'if-function'],
          quietDeps: true,
        },
      },
    },
  },
});
