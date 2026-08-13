import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractReadmeBodyHtml,
  fetchHtmlPage,
  fetchJsonPage,
  parseZendeskArticleRef,
  stripCloudflareEmailProtection,
} from './lib/external-source-adapters.mjs';
import { readSourceConfigsForSync } from './lib/external-source-config.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const sourcesDir = resolve(docsRoot, 'sync-sources');
const outputDocsRoot = resolve(docsRoot, 'src/content/docs');
const outputManifestFile = resolve(
  docsRoot,
  'src/generated/external-sources-manifest.json',
);
const outputSidebarFile = resolve(
  docsRoot,
  'src/generated/external-sidebar.json',
);

const sources = await readSourceConfigsForSync(sourcesDir);
if (sources.length === 0) {
  console.log('No external sync sources found.');
  process.exit(0);
}

const manifest = {
  syncedAt: new Date().toISOString(),
  sources: [],
};
const sidebarSections = [];

for (const source of sources) {
  const sourceOutputDir = resolve(outputDocsRoot, source.outputDir);
  const pageMap = buildPageMap(source);

  await cleanDir(sourceOutputDir);

  const sourceResult = {
    id: source.id,
    type: source.type,
    baseUrl: source.baseUrl,
    outputDir: source.outputDir,
    pageCount: source.pages.length,
    writtenCount: 0,
    errors: [],
  };

  const sidebarItems = [];

  for (const page of source.pages) {
    try {
      const sourceUrl = new URL(page.targetPath, source.baseUrl).toString();
      const fetched = await fetchSourcePage(source, page, sourceUrl);
      const pageTitle = page.title ?? fetched.title;
      const rewriteResult = rewriteHtmlLinks({
        html: fetched.bodyHtml,
        baseUrl: source.baseUrl,
        currentPath: page.targetPath,
        mirroredPathToSlug: pageMap,
        linkPolicy: source.linkPolicy,
        internalPathPrefixes: source.internalPathPrefixes,
      });

      const markdown = renderMarkdownDocument({
        title: pageTitle,
        badgeLabel: source.badge?.label,
        sourceUrl,
        bodyHtml: rewriteResult.html,
      });

      const outputPath = join(sourceOutputDir, `${page.resultPath}.md`);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, markdown, 'utf8');

      sourceResult.writtenCount += 1;
      sidebarItems.push({
        label: pageTitle,
        slug: pageMap.get(page.targetPath),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sourceResult.errors.push({
        targetPath: page.targetPath,
        message,
      });
    }
  }

  if (source.strictMissing && sourceResult.errors.length > 0) {
    throw new Error(
      `External source ${source.id} failed: ${sourceResult.errors
        .map((entry) => `${entry.targetPath} (${entry.message})`)
        .join(', ')}`,
    );
  }

  if (sidebarItems.length > 0) {
    sidebarSections.push({
      label: source.sidebarSection,
      items: sidebarItems,
    });
  }

  manifest.sources.push(sourceResult);
  console.log(
    `Synced ${source.id}: ${sourceResult.writtenCount}/${sourceResult.pageCount} pages`,
  );
}

await mkdir(dirname(outputManifestFile), { recursive: true });
await writeFile(
  outputManifestFile,
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

await mkdir(dirname(outputSidebarFile), { recursive: true });
await writeFile(
  outputSidebarFile,
  `${JSON.stringify(sidebarSections, null, 2)}\n`,
  'utf8',
);

function buildPageMap(source) {
  const pathToSlug = new Map();
  const seenSlugs = new Set();

  for (const page of source.pages) {
    const slug = normalizePath(`${source.outputDir}/${page.resultPath}`);
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate result slug in ${source.id}: ${slug}`);
    }

    seenSlugs.add(slug);
    pathToSlug.set(page.targetPath, slug);
  }

  return pathToSlug;
}

function rewriteHtmlLinks({
  html,
  baseUrl,
  currentPath,
  mirroredPathToSlug,
  linkPolicy,
  internalPathPrefixes,
}) {
  const base = new URL(baseUrl);
  const currentUrl = new URL(currentPath, base);

  return {
    html: html.replace(
      /\b(href|src)=("([^"]*)"|'([^']*)')/g,
      (match, attr, _quoted, dq, sq) => {
        const rawValue = dq ?? sq ?? '';
        if (!rawValue) return match;
        if (rawValue.startsWith('mailto:')) return match;
        if (rawValue.startsWith('#')) return match;
        if (rawValue.startsWith('data:')) return match;

        let url;
        try {
          url = new URL(rawValue, currentUrl);
        } catch {
          return match;
        }

        let nextValue = rawValue;
        const sameOrigin = url.origin === base.origin;

        if (attr === 'href' && sameOrigin) {
          const mappedSlug = mirroredPathToSlug.get(url.pathname);
          if (mappedSlug) {
            nextValue = `/${mappedSlug}${url.hash}`;
          } else if (
            linkPolicy === 'fail_non_mirrored' &&
            shouldTreatAsInternalPath(url.pathname, internalPathPrefixes)
          ) {
            throw new Error(`Unmirrored internal link: ${url.pathname}`);
          } else {
            nextValue = url.toString();
          }
        } else if (attr === 'src' && sameOrigin) {
          nextValue = url.toString();
        }

        return `${attr}="${escapeHtmlAttribute(nextValue)}"`;
      },
    ),
  };
}

function renderMarkdownDocument({ title, badgeLabel, sourceUrl, bodyHtml }) {
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `source_url: ${JSON.stringify(sourceUrl)}`,
    '---',
    '',
  ];

  if (badgeLabel) {
    lines.push(`> **${badgeLabel}:** [View original page](${sourceUrl})`, '');
  }

  lines.push(bodyHtml.trim(), '');
  return lines.join('\n');
}

function shouldTreatAsInternalPath(pathname, internalPathPrefixes) {
  return internalPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function normalizePath(value) {
  return value
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\.md$/i, '')
    .trim();
}

function escapeHtmlAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

async function fetchSourcePage(source, page, url) {
  if (source.type === 'zendesk') {
    return fetchZendeskPage(source.baseUrl, page.targetPath);
  }
  return fetchReadmePage(url);
}

async function fetchReadmePage(url) {
  const response = await fetchHtmlPage(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${url}`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const bodyHtml = extractReadmeBodyHtml(html);
  return { title, bodyHtml };
}

async function fetchZendeskPage(baseUrl, targetPath) {
  const articleRef = parseZendeskArticleRef(targetPath);
  const apiUrl = new URL(
    `/api/v2/help_center/${articleRef.locale}/articles/${articleRef.articleId}.json`,
    baseUrl,
  );

  const response = await fetchJsonPage(apiUrl.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${apiUrl}`);
  }

  const payload = await response.json();
  const article = payload?.article;
  if (!article || typeof article !== 'object') {
    throw new Error(`Invalid Zendesk API payload at ${apiUrl}`);
  }

  const title =
    typeof article.title === 'string' && article.title.trim() !== ''
      ? article.title.trim()
      : typeof article.name === 'string' && article.name.trim() !== ''
        ? article.name.trim()
        : `Zendesk article ${articleRef.articleId}`;
  const bodyHtml =
    typeof article.body === 'string'
      ? stripCloudflareEmailProtection(article.body)
      : '';
  if (!bodyHtml) {
    throw new Error(`Missing Zendesk article body for ${articleRef.articleId}`);
  }

  return { title, bodyHtml };
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (!match?.[1]) return 'Untitled';
  return decodeHtmlEntities(match[1].trim());
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function cleanDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
  await mkdir(dirPath, { recursive: true });
}
