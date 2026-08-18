import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
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

// Build timestamp pinned to America/New_York so the footer "site last
// updated" date matches the project's home time zone regardless of where
// the build runs (local laptop, CI, etc.).
const now = new Date();
const buildDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(now); // e.g. "May 27, 2026"
const buildYear = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
}).format(now); // e.g. "2026"

const robotsTxtConfig = {
  policy: [
    {
      userAgent: '*',
      disallow: '/',
    },
  ],
};

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

const isGovHostname = (hostname) => {
  const normalized = hostname.toLowerCase().replace(/\.+$/, '');
  return normalized === 'gov' || normalized.endsWith('.gov');
};

const requiresExitNotice = (href) => {
  try {
    const parsed = new URL(href);
    return (
      HTTP_PROTOCOLS.has(parsed.protocol) && !isGovHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
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
        if (requiresExitNotice(node.properties.href)) {
          node.properties['data-requires-exit-notice'] = 'true';
        }
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
    mdx({
      extendMarkdownConfig: false,
      rehypePlugins: [externalLinks],
    }),
    react(),
    sitemap(),
    favicons(),
    robotsTxt(robotsTxtConfig),
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [externalLinks],
    }),
  },
  vite: {
    define: {
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILD_YEAR__: JSON.stringify(buildYear),
    },
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
