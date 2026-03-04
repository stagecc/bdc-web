import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './a11y',
  timeout: 30_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npx astro preview --port 4321',
    port: 4321,
    reuseExistingServer: true,
  },
});
