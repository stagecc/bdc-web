import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import favicons from 'astro-favicons';
import { loadEnv } from 'vite';

const siteUrl = process.env.SITE_URL || 'https://biodatacatalyst.nhlbi.nih.gov';

const rootDir = dirname(fileURLToPath(import.meta.url));
Object.assign(process.env, loadEnv('', rootDir, ''));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default defineConfig({
  site: siteUrl,
  integrations: [mdx(), react(), sitemap(), favicons()],
  markdown: {
    remarkPlugins: [['remark-excerpt', { remove: true }]],
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
