import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

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

const sources = await readSourceConfigs(sourcesDir);
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
      const fetched = await fetchReadmePage(sourceUrl);
      const pageTitle = page.title ?? fetched.title;
      const rewriteResult = rewriteHtmlLinks({
        html: fetched.bodyHtml,
        baseUrl: source.baseUrl,
        currentPath: page.targetPath,
        mirroredPathToSlug: pageMap,
        linkPolicy: source.linkPolicy,
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
            url.pathname.startsWith('/docs/')
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
    configs.push(normalizeAndValidateSource(parsed, fileName));
  }

  return configs;
}

function normalizeAndValidateSource(raw, fileName) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid source config in ${fileName}: expected object`);
  }

  const id = asString(raw.id, 'id', fileName);
  const type = asString(raw.type, 'type', fileName);
  if (type !== 'readme') {
    throw new Error(`Unsupported source type in ${fileName}: ${type}`);
  }

  const baseUrl = normalizeBaseUrl(
    asString(raw.base_url, 'base_url', fileName),
  );
  const outputDir = normalizePath(
    asString(raw.output_dir, 'output_dir', fileName),
  );
  const sidebarSection = asString(
    raw.sidebar_section,
    'sidebar_section',
    fileName,
  );
  const strictMissing = asBoolean(
    raw.strict_missing,
    'strict_missing',
    fileName,
  );
  const linkPolicy = asString(raw.link_policy, 'link_policy', fileName);

  if (
    linkPolicy !== 'externalize_non_mirrored' &&
    linkPolicy !== 'fail_non_mirrored'
  ) {
    throw new Error(`Invalid link_policy in ${fileName}: ${linkPolicy}`);
  }

  const badge = normalizeBadge(raw.badge, fileName);

  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    throw new Error(`pages must be a non-empty array in ${fileName}`);
  }

  const pages = raw.pages.map((page, index) =>
    normalizePage(page, index, fileName),
  );

  return {
    id,
    type,
    baseUrl,
    outputDir,
    sidebarSection,
    strictMissing,
    linkPolicy,
    badge,
    pages,
  };
}

function normalizeBadge(rawBadge, fileName) {
  if (rawBadge === undefined || rawBadge === null) return null;
  if (typeof rawBadge !== 'object' || Array.isArray(rawBadge)) {
    throw new Error(`badge must be an object in ${fileName}`);
  }

  const enabled =
    rawBadge.enabled === undefined
      ? true
      : asBoolean(rawBadge.enabled, 'badge.enabled', fileName);
  if (!enabled) return null;

  const label =
    rawBadge.label === undefined
      ? 'Synced from external docs'
      : asString(rawBadge.label, 'badge.label', fileName);
  return { label };
}

function normalizePage(rawPage, index, fileName) {
  if (!rawPage || typeof rawPage !== 'object' || Array.isArray(rawPage)) {
    throw new Error(`Invalid page at index ${index} in ${fileName}`);
  }

  const targetPath = normalizeTargetPath(
    asString(rawPage.target_path, `pages[${index}].target_path`, fileName),
    fileName,
  );

  const resultPath = rawPage.result_path
    ? normalizePath(
        asString(rawPage.result_path, `pages[${index}].result_path`, fileName),
      )
    : deriveResultPath(targetPath);

  const title =
    rawPage.title === undefined
      ? null
      : asString(rawPage.title, `pages[${index}].title`, fileName);

  return {
    title,
    targetPath,
    resultPath,
  };
}

function normalizeTargetPath(value, fileName) {
  if (!value.startsWith('/')) {
    throw new Error(`target_path must start with / in ${fileName}: ${value}`);
  }

  return normalizePath(value.startsWith('/docs') ? value : value).startsWith(
    'docs/',
  )
    ? `/${normalizePath(value).replace(/^docs\//, 'docs/')}`
    : `/${normalizePath(value)}`;
}

function deriveResultPath(targetPath) {
  const withoutPrefix = targetPath
    .replace(/^\/docs\/?/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return withoutPrefix || 'index';
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  return url.toString().replace(/\/+$/, '');
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

function asString(value, fieldName, fileName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Expected string for ${fieldName} in ${fileName}`);
  }

  return value.trim();
}

function asBoolean(value, fieldName, fileName) {
  if (typeof value !== 'boolean') {
    throw new Error(`Expected boolean for ${fieldName} in ${fileName}`);
  }

  return value;
}

async function fetchReadmePage(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'bdc-docs-sync/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${url}`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const bodyHtml = extractReadmeBodyHtml(html);
  return { title, bodyHtml };
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (!match?.[1]) return 'Untitled';
  return decodeHtmlEntities(match[1].trim());
}

function extractReadmeBodyHtml(html) {
  const match = html.match(
    /data-testid="RDMD"[^>]*>([\s\S]*?)<\/div><\/div><div class="UpdatedAt"/,
  );
  if (!match?.[1]) {
    throw new Error('Unable to locate ReadMe page body');
  }

  return match[1].trim();
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
