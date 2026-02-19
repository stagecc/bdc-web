import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import favicons from 'astro-favicons';
import sitemap from '@astrojs/sitemap';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default defineConfig({
  site: 'https://biodatacatalyst.nhlbi.nih.gov',
  integrations: [mdx(), react(), sitemap()],
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
        },
      },
    },
  },
});
