import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default defineConfig({
  integrations: [mdx(), react()],
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
