import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), react()],
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
