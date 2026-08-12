import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const sourcesDir = resolve(docsRoot, 'sync-sources');
const lockFilePath = resolve(docsRoot, 'external.lock.json');

const sources = await readSourceConfigs(sourcesDir);

const lock = {
  sources: [],
};

for (const source of sources) {
  if (source.type !== 'readme') {
    throw new Error(`Unsupported source type: ${source.type}`);
  }

  const pages = [];
  for (const page of source.pages) {
    const sourceUrl = new URL(page.targetPath, source.baseUrl).toString();
    const response = await fetch(sourceUrl, {
      headers: {
        'user-agent': 'bdc-docs-external-check/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${source.id} ${page.targetPath}: HTTP ${response.status}`,
      );
    }

    const html = await response.text();
    const body = extractReadmeBodyHtml(html);
    const normalized = normalizeContentForHash(body);

    pages.push({
      target_path: page.targetPath,
      source_url: sourceUrl,
      content_hash: sha256(normalized),
    });
  }

  pages.sort((a, b) => a.target_path.localeCompare(b.target_path));

  const sourceHashInput = pages
    .map((page) => `${page.target_path}:${page.content_hash}`)
    .join('\n');

  lock.sources.push({
    id: source.id,
    type: source.type,
    base_url: source.baseUrl,
    source_hash: sha256(sourceHashInput),
    pages,
  });
}

lock.sources.sort((a, b) => a.id.localeCompare(b.id));

await writeFile(lockFilePath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
console.log(`Wrote external lock: ${lockFilePath}`);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeContentForHash(input) {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/ data-testid="[^"]+"/g, '')
    .replace(/ class="[^"]*"/g, '')
    .trim();
}

function extractReadmeBodyHtml(html) {
  const match = html.match(
    /data-testid="RDMD"[^>]*>([\s\S]*?)<\/div><\/div><div class="UpdatedAt"/,
  );
  if (!match?.[1]) {
    throw new Error('Unable to locate ReadMe page body for hashing');
  }

  return match[1].trim();
}

async function readSourceConfigs(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      const ext = extname(name).toLowerCase();
      return ext === '.yaml' || ext === '.yml';
    })
    .sort();

  const configs = [];
  for (const fileName of files) {
    const filePath = join(dirPath, fileName);
    const raw = await readFile(filePath, 'utf8');
    const parsed = loadYaml(raw);
    configs.push(normalizeSource(parsed, fileName));
  }

  return configs;
}

function normalizeSource(raw, fileName) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid source config in ${fileName}: expected object`);
  }

  const id = asString(raw.id, 'id', fileName);
  const type = asString(raw.type, 'type', fileName);
  const baseUrl = normalizeBaseUrl(asString(raw.base_url, 'base_url', fileName));

  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    throw new Error(`pages must be a non-empty array in ${fileName}`);
  }

  const pages = raw.pages.map((page, index) => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      throw new Error(`Invalid page at index ${index} in ${fileName}`);
    }

    const targetPath = asString(
      page.target_path,
      `pages[${index}].target_path`,
      fileName,
    );
    if (!targetPath.startsWith('/')) {
      throw new Error(
        `target_path must start with / in ${fileName}: ${targetPath}`,
      );
    }

    return {
      targetPath: targetPath.replace(/\/+$/, ''),
    };
  });

  return {
    id,
    type,
    baseUrl,
    pages,
  };
}

function asString(value, fieldName, fileName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Expected string for ${fieldName} in ${fileName}`);
  }

  return value.trim();
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  return url.toString().replace(/\/+$/, '');
}
