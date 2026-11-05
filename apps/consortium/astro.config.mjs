import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import awsAmplify from 'astro-aws-amplify';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default defineConfig({
  output: 'server',
  security: {
    allowedDomains: process.env.AUTH_ORIGIN
      ? [
          {
            hostname: new URL(process.env.AUTH_ORIGIN).hostname,
            protocol: 'https',
          },
        ]
      : [],
  },
  adapter: awsAmplify({ runtimeEnv: ['AUTH_ORIGIN', 'AUTH_SESSION_SECRET'] }),
  integrations: [mdx(), react()],
  markdown: {
    processor: unified(),
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
