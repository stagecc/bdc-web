import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { load as loadYaml } from 'js-yaml';

// Shared source config loading + validation for external docs scripts.
//
// We intentionally expose two entry points because lock generation and sync
// orchestration need different normalized shapes:
// - lock: minimal fields needed to fetch + hash source bodies
// - sync: full fields needed to render output + sidebar
export async function readSourceConfigsForSync(dirPath) {
  const rawConfigs = await readRawSourceConfigs(dirPath);
  return rawConfigs.map(({ parsed, fileName }) =>
    normalizeAndValidateSyncSource(parsed, fileName),
  );
}

export async function readSourceConfigsForLock(dirPath) {
  const rawConfigs = await readRawSourceConfigs(dirPath);
  return rawConfigs.map(({ parsed, fileName }) =>
    normalizeAndValidateLockSource(parsed, fileName),
  );
}

async function readRawSourceConfigs(dirPath) {
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
    configs.push({ parsed, fileName });
  }

  return configs;
}

function normalizeAndValidateLockSource(raw, fileName) {
  const source = normalizeCommonSource(raw, fileName);
  const pages = normalizeLockPages(raw, fileName);

  return {
    id: source.id,
    type: source.type,
    baseUrl: source.baseUrl,
    pages,
  };
}

function normalizeAndValidateSyncSource(raw, fileName) {
  const source = normalizeCommonSource(raw, fileName);

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
    normalizeSyncPage(page, index, fileName),
  );

  return {
    id: source.id,
    type: source.type,
    baseUrl: source.baseUrl,
    internalPathPrefixes: resolveInternalPathPrefixes(source.type),
    outputDir,
    sidebarSection,
    strictMissing,
    linkPolicy,
    badge,
    pages,
  };
}

function normalizeCommonSource(raw, fileName) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid source config in ${fileName}: expected object`);
  }

  const id = asString(raw.id, 'id', fileName);
  const type = asString(raw.type, 'type', fileName);
  if (type !== 'readme' && type !== 'zendesk') {
    throw new Error(`Unsupported source type in ${fileName}: ${type}`);
  }

  const baseUrl = normalizeBaseUrl(
    asString(raw.base_url, 'base_url', fileName),
  );
  return { id, type, baseUrl };
}

function normalizeLockPages(raw, fileName) {
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    throw new Error(`pages must be a non-empty array in ${fileName}`);
  }

  return raw.pages.map((page, index) => {
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
      // Lock flow only needs target_path; result/title are sync-only concerns.
      targetPath: targetPath.replace(/\/+$/, ''),
    };
  });
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

function normalizeSyncPage(rawPage, index, fileName) {
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

  return `/${normalizePath(value)}`;
}

function resolveInternalPathPrefixes(sourceType) {
  if (sourceType === 'zendesk') return ['/hc/'];
  return ['/docs/'];
}

function deriveResultPath(targetPath) {
  const normalized = targetPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const fromDocs = normalized.replace(/^docs\/?/i, '');
  if (fromDocs && fromDocs !== normalized) return fromDocs;

  const zendeskArticle = normalized.match(/^hc\/[a-z-]+\/articles\/(.+)$/i);
  if (zendeskArticle?.[1]) {
    return zendeskArticle[1].replace(/^\d+-/, '');
  }

  return normalized || 'index';
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
