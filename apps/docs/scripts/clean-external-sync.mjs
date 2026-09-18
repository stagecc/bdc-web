import { readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const docsContentRoot = resolve(docsRoot, 'src/content/docs');
const legacyExternalRoot = resolve(docsContentRoot, 'external');
const manifestPath = resolve(docsRoot, 'src/generated/external-sources-manifest.json');
const sidebarPath = resolve(docsRoot, 'src/generated/external-sidebar.json');

const managedFiles = await readManagedFilesFromManifest(manifestPath, docsRoot);

let removedManagedFileCount = 0;
for (const filePath of managedFiles) {
  await rm(filePath, { force: true });
  removedManagedFileCount += 1;
}

await rm(legacyExternalRoot, { recursive: true, force: true });
await rm(sidebarPath, { force: true });
await rm(manifestPath, { force: true });

console.log(`Removed ${removedManagedFileCount} manifest-managed external page file(s)`);
console.log('Removed legacy external docs directory and generated external sync metadata');

async function readManagedFilesFromManifest(filePath, docsRootDir) {
  let parsed;

  try {
    const raw = await readFile(filePath, 'utf8');
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sources)) {
    return new Set();
  }

  const files = new Set();

  for (const source of parsed.sources) {
    if (!source || typeof source !== 'object') continue;
    if (!Array.isArray(source.managedFiles)) continue;

    for (const relativeEntry of source.managedFiles) {
      if (typeof relativeEntry !== 'string' || relativeEntry.trim() === '') continue;

      const normalizedRelative = normalizeFilePath(relativeEntry).replace(/^\/+/, '');
      if (!normalizedRelative.startsWith('src/content/docs/')) continue;
      if (!normalizedRelative.endsWith('.md')) continue;

      const absolutePath = normalizeFilePath(resolve(docsRootDir, normalizedRelative));
      const docsContentPrefix = `${normalizeFilePath(resolve(docsRootDir, 'src/content/docs'))}/`;
      if (!absolutePath.startsWith(docsContentPrefix)) continue;

      files.add(absolutePath);
    }
  }

  return files;
}

function normalizeFilePath(value) {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
}
