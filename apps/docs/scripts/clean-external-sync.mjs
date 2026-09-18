import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const generatedPaths = [
  resolve(docsRoot, 'src/content/docs'),
  resolve(docsRoot, 'public/gitbook-assets'),
  resolve(docsRoot, 'src/config/sidebar.generated.ts'),
  resolve(docsRoot, 'src/generated/gitbook-manifest.json'),
  resolve(docsRoot, 'src/generated/external-sources-manifest.json'),
  resolve(docsRoot, 'src/generated/external-sidebar.json'),
];

for (const pathToRemove of generatedPaths) {
  await rm(pathToRemove, { recursive: true, force: true });
}

console.log('Removed all generated docs sync outputs (content, assets, sidebars, manifests)');
