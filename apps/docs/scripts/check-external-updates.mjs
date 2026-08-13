import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractReadmeBodyHtml,
  fetchHtmlPage,
  fetchJsonPage,
  parseZendeskArticleRef,
  stripCloudflareEmailProtection,
} from './lib/external-source-adapters.mjs';
import { readSourceConfigsForLock } from './lib/external-source-config.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const sourcesDir = resolve(docsRoot, 'sync-sources');
const lockFilePath = resolve(docsRoot, 'external.lock.json');

const sources = await readSourceConfigsForLock(sourcesDir);

const lock = {
  sources: [],
};

for (const source of sources) {
  if (source.type !== 'readme' && source.type !== 'zendesk') {
    throw new Error(`Unsupported source type: ${source.type}`);
  }

  const pages = [];
  for (const page of source.pages) {
    const sourceUrl = new URL(page.targetPath, source.baseUrl).toString();
    const body = await fetchBodyForSource(source, page, sourceUrl);
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
  return normalizeCloudflareEmails(input)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/ data-testid="[^"]+"/g, '')
    .replace(/ class="[^"]*"/g, '')
    .trim();
}

function normalizeCloudflareEmails(input) {
  return input
    .replace(
      /\/cdn-cgi\/l\/email-protection#([a-f\d]+)/gi,
      (_, encoded) => `mailto:${decodeCloudflareEmail(encoded)}`,
    )
    .replace(
      /data-cfemail="([a-f\d]+)"/gi,
      (_, encoded) => `data-email="${decodeCloudflareEmail(encoded)}"`,
    );
}

function decodeCloudflareEmail(encoded) {
  const key = Number.parseInt(encoded.slice(0, 2), 16);
  let decoded = '';

  for (let index = 2; index < encoded.length; index += 2) {
    const byte = Number.parseInt(encoded.slice(index, index + 2), 16);
    decoded += String.fromCharCode(byte ^ key);
  }

  return decoded;
}

async function fetchBodyForSource(source, page, sourceUrl) {
  if (source.type === 'zendesk') {
    return fetchZendeskBodyFromApi(source.baseUrl, page.targetPath);
  }

  const response = await fetchHtmlPage(sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${source.id} ${page.targetPath}: HTTP ${response.status}`,
    );
  }

  const html = await response.text();
  try {
    return extractReadmeBodyHtml(html);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Unable to locate readme.io page body'
    ) {
      throw new Error('Unable to locate readme.io page body for hashing');
    }
    throw error;
  }
}

async function fetchZendeskBodyFromApi(baseUrl, targetPath) {
  const articleRef = parseZendeskArticleRef(targetPath);
  const apiUrl = new URL(
    `/api/v2/help_center/${articleRef.locale}/articles/${articleRef.articleId}.json`,
    baseUrl,
  );

  const response = await fetchJsonPage(apiUrl.toString());
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Zendesk article ${targetPath}: HTTP ${response.status}`,
    );
  }

  const payload = await response.json();
  const article = payload?.article;
  if (
    !article ||
    typeof article !== 'object' ||
    typeof article.body !== 'string'
  ) {
    throw new Error(`Invalid Zendesk article payload for ${targetPath}`);
  }

  return stripCloudflareEmailProtection(article.body);
}
