import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const sitemapPath = process.argv[2] ?? 'dist/sitemap-0.xml';
const baseUrl = 'http://localhost:4321';

const xml = readFileSync(sitemapPath, 'utf-8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => {
  const parsed = new URL(match[1]);
  return `${baseUrl}${parsed.pathname}`;
});

if (urls.length === 0) {
  console.error('No URLs found in sitemap');
  process.exit(1);
}

console.log(`Testing ${urls.length} pages from sitemap…`);

try {
  execSync('npx playwright test a11y/page.test.ts', {
    stdio: 'inherit',
    env: { ...process.env, A11Y_URLS: urls.join(' ') },
  });
} catch (error) {
  process.exit(error.status ?? 1);
}
