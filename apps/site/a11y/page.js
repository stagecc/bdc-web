import { execSync } from 'node:child_process';

const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.error('Usage: npm run a11y:page -- <url> [url...]');
  process.exit(1);
}

try {
  execSync('npx playwright test a11y/page.test.ts', {
    stdio: 'inherit',
    env: { ...process.env, A11Y_URLS: urls.join(' ') },
  });
} catch (error) {
  process.exit(error.status ?? 1);
}
