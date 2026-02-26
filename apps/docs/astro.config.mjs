import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

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
      social: {
        github: 'https://github.com/stagecc/bdc-web',
      },
      customCss: ['./src/styles/custom.scss'],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Introduction', slug: 'guides/intro' },
            { label: 'Quick Start', slug: 'guides/quick-start' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        { label: 'Getting Started', slug: 'getting-started' },
        {
          label: 'Community',
          items: [
            { label: 'Who We Are', slug: 'community' },
            { label: 'BDC Glossary', slug: 'community/glossary' },
            {
              label: 'Citation and Acknowledgement',
              slug: 'community/citation-and-acknowledgement',
            },
            {
              label: 'Strategic Planning',
              slug: 'community/strategic-planning',
            },
            {
              label: 'Request for Comments',
              items: [
                { label: 'Overview', slug: 'community/request-for-comments' },
                {
                  label: 'Ecosystem Security Statement',
                  slug: 'community/request-for-comments/ecosystem-security-statement',
                },
                {
                  label: 'DICOM De-Identification',
                  slug: 'community/request-for-comments/dicom-de-identification',
                },
              ],
              collapsed: true,
            },
            {
              label: 'Video Content Guidance',
              slug: 'community/video-content-guidance',
            },
            {
              label: 'Contributing User Resources',
              slug: 'community/contributing-user-resources',
            },
          ],
        },
        {
          label: 'Data Access',
          items: [
            { label: 'Overview', slug: 'data-access' },
            {
              label: 'Data Interoperability',
              slug: 'data-access/data-interoperability',
            },
            {
              label: 'Understanding Access',
              slug: 'data-access/understanding-access',
            },
            {
              label: 'Submitting a dbGaP Request',
              slug: 'data-access/submitting-dbgap-request',
            },
            { label: 'Checking Access', slug: 'data-access/checking-access' },
          ],
        },
        {
          label: 'Explore Available Data',
          items: [
            { label: 'Overview', slug: 'explore-available-data' },
            {
              label: 'Dug Semantic Search',
              items: [
                {
                  label: 'Overview',
                  slug: 'explore-available-data/dug-semantic-search',
                },
                {
                  label: 'Search and Results',
                  slug: 'explore-available-data/dug-semantic-search/search-and-results',
                },
              ],
              collapsed: true,
            },
            {
              label: 'PIC-SURE',
              items: [
                {
                  label: 'User Guide',
                  slug: 'explore-available-data/pic-sure',
                },
                {
                  label: 'Getting Started',
                  slug: 'explore-available-data/pic-sure/getting-started',
                },
                {
                  label: 'Requirements and Login',
                  slug: 'explore-available-data/pic-sure/requirements-and-login',
                },
                {
                  label: 'Available Data',
                  slug: 'explore-available-data/pic-sure/available-data',
                },
                {
                  label: 'TOPMed Datasets',
                  slug: 'explore-available-data/pic-sure/topmed-datasets',
                },
                {
                  label: 'BioLINCC Datasets',
                  slug: 'explore-available-data/pic-sure/biolincc-datasets',
                },
                {
                  label: 'CONNECTS Dataset',
                  slug: 'explore-available-data/pic-sure/connects-dataset',
                },
                {
                  label: 'Data Organization',
                  slug: 'explore-available-data/pic-sure/data-organization',
                },
                {
                  label: 'Features and Layout',
                  slug: 'explore-available-data/pic-sure/features-and-layout',
                },
                {
                  label: 'Open vs. Authorized Access',
                  slug: 'explore-available-data/pic-sure/open-vs-authorized-access',
                },
                {
                  label: 'Open Access',
                  slug: 'explore-available-data/pic-sure/open-access',
                },
                {
                  label: 'Authorized Access',
                  slug: 'explore-available-data/pic-sure/authorized-access',
                },
                {
                  label: 'API Analysis',
                  slug: 'explore-available-data/pic-sure/api-analysis',
                },
                {
                  label: 'Additional Resources',
                  slug: 'explore-available-data/pic-sure/additional-resources',
                },
                {
                  label: 'API Documentation',
                  slug: 'explore-available-data/pic-sure/api-documentation',
                },
                {
                  label: 'Appendix 1: Identifiers',
                  slug: 'explore-available-data/pic-sure/appendix-1-identifiers',
                },
                {
                  label: 'Appendix 2: Harmonized Variables',
                  slug: 'explore-available-data/pic-sure/appendix-2-harmonized-variables',
                },
              ],
              collapsed: true,
            },
            {
              label: 'Gen3',
              items: [
                { label: 'Overview', slug: 'explore-available-data/gen3' },
                {
                  label: 'Dictionary',
                  slug: 'explore-available-data/gen3/dictionary',
                },
                {
                  label: 'Exploration',
                  slug: 'explore-available-data/gen3/exploration',
                },
                { label: 'Query', slug: 'explore-available-data/gen3/query' },
                {
                  label: 'Workspace',
                  slug: 'explore-available-data/gen3/workspace',
                },
                {
                  label: 'Profile',
                  slug: 'explore-available-data/gen3/profile',
                },
                {
                  label: 'PFB Files',
                  slug: 'explore-available-data/gen3/pfb-files',
                },
                {
                  label: 'Current Projects',
                  slug: 'explore-available-data/gen3/current-projects',
                },
              ],
              collapsed: true,
            },
          ],
        },
        {
          label: 'Analyze Data',
          items: [
            { label: 'Overview', slug: 'analyze-data' },
            {
              label: 'Transferring Files',
              slug: 'analyze-data/transferring-files',
            },
            {
              label: 'Seven Bridges',
              items: [
                { label: 'Overview', slug: 'analyze-data/seven-bridges' },
                {
                  label: 'Knowledge Center',
                  slug: 'analyze-data/seven-bridges/knowledge-center',
                },
                {
                  label: 'Getting Started',
                  slug: 'analyze-data/seven-bridges/getting-started',
                },
                {
                  label: 'Analysis Tips',
                  slug: 'analyze-data/seven-bridges/analysis-tips',
                },
                {
                  label: 'Troubleshooting Tasks',
                  slug: 'analyze-data/seven-bridges/troubleshooting-tasks',
                },
                {
                  label: 'GWAS with GENESIS',
                  slug: 'analyze-data/seven-bridges/gwas-genesis',
                },
                {
                  label: 'Annotation Explorer',
                  slug: 'analyze-data/seven-bridges/annotation-explorer',
                },
              ],
              collapsed: true,
            },
            {
              label: 'Terra',
              items: [
                { label: 'Overview', slug: 'analyze-data/terra' },
                {
                  label: 'Account Setup',
                  slug: 'analyze-data/terra/account-setup',
                },
                { label: 'Billing', slug: 'analyze-data/terra/billing' },
                {
                  label: 'Managing Costs',
                  slug: 'analyze-data/terra/managing-costs',
                },
                {
                  label: 'Workspace Setup',
                  slug: 'analyze-data/terra/workspace-setup',
                },
                {
                  label: 'Data Storage',
                  slug: 'analyze-data/terra/data-storage',
                },
                {
                  label: 'Collaboration',
                  slug: 'analyze-data/terra/collaboration',
                },
                { label: 'Security', slug: 'analyze-data/terra/security' },
                { label: 'Bring Data', slug: 'analyze-data/terra/bring-data' },
                {
                  label: 'Data from Gen3',
                  slug: 'analyze-data/terra/data-from-gen3',
                },
                {
                  label: 'Data from Library',
                  slug: 'analyze-data/terra/data-from-library',
                },
                {
                  label: 'Use Own Data',
                  slug: 'analyze-data/terra/use-own-data',
                },
                {
                  label: 'Run Analyses',
                  slug: 'analyze-data/terra/run-analyses',
                },
                {
                  label: 'Batch Workflows',
                  slug: 'analyze-data/terra/batch-workflows',
                },
                {
                  label: 'Interactive Analysis',
                  slug: 'analyze-data/terra/interactive-analysis',
                },
                { label: 'GWAS', slug: 'analyze-data/terra/gwas' },
                {
                  label: 'Troubleshooting',
                  slug: 'analyze-data/terra/troubleshooting',
                },
              ],
              collapsed: true,
            },
          ],
        },
        {
          label: 'Community Tools & Integration',
          items: [
            { label: 'Overview', slug: 'community-tools' },
            {
              label: 'Bring Your Own Tool',
              items: [
                {
                  label: 'Overview',
                  slug: 'community-tools/bring-your-own-tool',
                },
                {
                  label: 'BYOT Glossary',
                  slug: 'community-tools/bring-your-own-tool/glossary',
                },
                {
                  label: 'Working with Docker',
                  slug: 'community-tools/bring-your-own-tool/docker',
                },
                {
                  label: 'WDL Workflows',
                  slug: 'community-tools/bring-your-own-tool/wdl-workflows',
                },
                {
                  label: 'CWL Workflows',
                  slug: 'community-tools/bring-your-own-tool/cwl-workflows',
                },
                {
                  label: 'Version Control',
                  slug: 'community-tools/bring-your-own-tool/version-control',
                },
                {
                  label: 'Advanced Topics',
                  slug: 'community-tools/bring-your-own-tool/advanced-topics',
                },
              ],
              collapsed: true,
            },
          ],
        },
        { label: 'Grant Proposals', slug: 'grant-proposals' },
        { label: 'Cloud Costs', slug: 'cloud-costs' },
        {
          label: 'Release Notes',
          collapsed: true,
          autogenerate: { directory: 'release-notes' },
        },
        {
          label: 'Tutorials',
          items: [
            { label: 'Overview', slug: 'tutorials' },
            {
              label: 'Seven Bridges',
              items: [
                { label: 'Overview', slug: 'tutorials/seven-bridges' },
                {
                  label: 'GENESIS Workflows',
                  slug: 'tutorials/seven-bridges/genesis-workflows',
                },
                {
                  label: 'Cloud Costs',
                  slug: 'tutorials/seven-bridges/cloud-costs',
                },
              ],
              collapsed: true,
            },
            {
              label: 'Terra',
              items: [
                { label: 'Overview', slug: 'tutorials/terra' },
                {
                  label: 'Gen3 Data on Terra',
                  slug: 'tutorials/terra/gen3-data-on-terra',
                },
                {
                  label: 'GWAS 1000 Genomes',
                  slug: 'tutorials/terra/gwas-1000-genomes',
                },
                { label: 'GWAS TOPMed', slug: 'tutorials/terra/gwas-topmed' },
                {
                  label: 'TOPMed Aligner',
                  slug: 'tutorials/terra/topmed-aligner',
                },
              ],
              collapsed: true,
            },
          ],
        },
        {
          label: 'Data Management',
          items: [
            { label: 'Strategy', slug: 'data-management' },
            {
              label: 'Data Submission',
              slug: 'data-management/data-submission',
            },
            {
              label: 'De-identification',
              slug: 'data-management/de-identification',
            },
            {
              label: 'Submission FAQs',
              slug: 'data-management/submission-faqs',
            },
            {
              label: 'dbGaP Configuration',
              slug: 'data-management/dbgap-configuration',
            },
          ],
        },
      ],
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
