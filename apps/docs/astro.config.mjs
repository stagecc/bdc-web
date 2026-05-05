import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { sidebar } from './src/config/sidebar.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

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
      sidebar,
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
