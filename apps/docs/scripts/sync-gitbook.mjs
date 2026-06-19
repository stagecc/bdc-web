import { execFileSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Build-time GitBook sync pipeline:
// 1. Resolve source repo/ref (env -> lock file -> defaults)
// 2. Clone source into a temp dir
// 3. Regenerate docs content + assets from source
// 4. Derive sidebar from SUMMARY.md
// 5. Emit manifest for traceability
const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(scriptDir, '..');
const lockFilePath = resolve(docsRoot, 'gitbook.lock.json');
const defaultRepoUrl = 'https://github.com/stagecc/bdc-gitbook.git';

const lockConfig = await readLockConfig(lockFilePath);

const repoUrl = process.env.GITBOOK_REPO ?? lockConfig.repo ?? defaultRepoUrl;
const repoRef = process.env.GITBOOK_REF ?? lockConfig.ref ?? 'main';
const skipSync = process.env.SKIP_CONTENT_SYNC === '1';
const allowOverwrite = process.env.GITBOOK_ALLOW_OVERWRITE === '1';
const outputDocsDir = resolve(
  docsRoot,
  process.env.GITBOOK_OUTPUT_DOCS_DIR ?? 'src/content/docs',
);
const outputAssetsDir = resolve(
  docsRoot,
  process.env.GITBOOK_OUTPUT_ASSETS_DIR ?? 'public/gitbook-assets',
);
const outputSidebarFile = resolve(
  docsRoot,
  process.env.GITBOOK_OUTPUT_SIDEBAR_FILE ?? 'src/config/sidebar.generated.ts',
);
const outputManifestFile = resolve(
  docsRoot,
  process.env.GITBOOK_OUTPUT_MANIFEST_FILE ??
    'src/generated/gitbook-manifest.json',
);

if (skipSync) {
  console.log('Skipping GitBook sync because SKIP_CONTENT_SYNC=1');
  process.exit(0);
}

if (!allowOverwrite) {
  throw new Error(
    'Refusing to overwrite docs content without GITBOOK_ALLOW_OVERWRITE=1. ' +
      'Use npm scripts (sync:content, build, dev:sync) or set the variable explicitly.',
  );
}

const tempRoot = await mkdtemp(join(tmpdir(), 'bdc-gitbook-sync-'));

try {
  const sourceDir = join(tempRoot, 'source');
  console.log(`Cloning ${repoUrl}#${repoRef} ...`);
  await cloneSourceRepo(sourceDir, repoUrl, repoRef);

  const summaryPath = join(sourceDir, 'SUMMARY.md');
  const summaryText = await readFile(summaryPath, 'utf8');

  await cleanDir(outputDocsDir);
  await cleanDir(outputAssetsDir);

  await copyMarkdownFiles(sourceDir, outputDocsDir);
  await ensureDefault404Doc(outputDocsDir);
  await copyGitbookAssets(sourceDir, outputAssetsDir);

  const sidebar = buildSidebarFromSummary(summaryText);
  await writeSidebarFile(outputSidebarFile, sidebar);

  const sha = execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();

  const stats = await countGeneratedFiles(outputDocsDir, outputAssetsDir);
  await writeManifest(outputManifestFile, {
    repoUrl,
    repoRef,
    sha,
    syncedAt: new Date().toISOString(),
    docsFiles: stats.docsFiles,
    assetFiles: stats.assetFiles,
  });

  console.log(
    `Synced GitBook content: ${stats.docsFiles} docs, ${stats.assetFiles} assets`,
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

async function cleanDir(dirPath) {
  // Always fully replace generated outputs to prevent stale artifacts.
  await rm(dirPath, { recursive: true, force: true });
  await mkdir(dirPath, { recursive: true });
}

async function copyMarkdownFiles(sourceDir, destinationDir) {
  const allFiles = await walkFiles(sourceDir);

  for (const absPath of allFiles) {
    const relPath = relative(sourceDir, absPath);
    if (shouldSkipSourceFile(relPath)) continue;
    if (extname(relPath).toLowerCase() !== '.md') continue;

    const content = await readFile(absPath, 'utf8');
    const transformed = transformMarkdown(content, relPath);

    const outRelPath = mapContentOutputPath(relPath);
    const outAbsPath = join(destinationDir, outRelPath);
    await mkdir(dirname(outAbsPath), { recursive: true });
    await writeFile(outAbsPath, transformed, 'utf8');
  }
}

async function copyGitbookAssets(sourceDir, destinationDir) {
  const sourceAssets = join(sourceDir, '.gitbook/assets');
  try {
    const info = await stat(sourceAssets);
    if (!info.isDirectory()) return;
  } catch {
    return;
  }

  await cp(sourceAssets, destinationDir, { recursive: true });
}

async function ensureDefault404Doc(docsDir) {
  const filePath = join(docsDir, '404.md');
  const content = [
    '---',
    'title: "Page Not Found"',
    'template: splash',
    '---',
    '',
    '# Page Not Found',
    '',
    'The page you requested does not exist in this documentation set.',
    '',
  ].join('\n');
  await writeFile(filePath, content, 'utf8');
}

function shouldSkipSourceFile(relPath) {
  if (relPath.startsWith('.git/')) return true;
  if (relPath.startsWith('.github/')) return true;
  if (relPath.startsWith('.gitbook/')) return true;
  if (relPath === 'SUMMARY.md') return true;
  return false;
}

function mapContentOutputPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized === 'README.md') return 'index.md';
  return normalized.replace(/\/README\.md$/, '/index.md');
}

function transformMarkdown(input, fileRelPath) {
  // Order matters: convert GitBook syntax first, then normalize frontmatter/headings.
  let content = input;

  content = transformHintBlocks(content);
  content = transformFileBlocks(content, fileRelPath);
  content = transformIncludeBlocks(content);
  content = transformEmbedBlocks(content);
  content = rewriteGitbookAssetPaths(content);
  content = rewriteInternalMarkdownLinks(content, fileRelPath);
  content = ensureFrontmatter(content, fileRelPath);
  content = removeDuplicateTopHeading(content);

  return content;
}

function transformHintBlocks(content) {
  const styleMap = {
    info: 'note',
    warning: 'caution',
    danger: 'danger',
    success: 'tip',
  };

  let next = content.replace(
    /\{%\s*hint\s+style="([a-z]+)"\s*%\}/g,
    (_match, style) => {
      const callout = styleMap[style] ?? 'note';
      return `:::${callout}`;
    },
  );

  next = next.replace(/\{%\s*endhint\s*%\}/g, ':::');
  return next;
}

function transformFileBlocks(content, fileRelPath) {
  // Existing block form:
  // {% file src="..." %}Label{% endfile %}
  let next = content.replace(
    /\{%\s*file\s+src="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endfile\s*%\}/g,
    (_match, src, inner) => {
      const text = inner
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      const label = text || basename(src);
      const target = rewriteLinkTarget(src, fileRelPath);
      return `[${label}](${target})`;
    },
  );

  // {% file src="..." %}
  next = next.replace(/\{%\s*file\s+src="([^"]+)"\s*%\}/g, (_match, src) => {
    const label = basename(src);
    const target = rewriteLinkTarget(src, fileRelPath);
    return `[${label}](${target})`;
  });

  return next;
}

function transformIncludeBlocks(content) {
  return content.replace(
    /\{%\s*include\s+"([^"]+)"\s*%\}/g,
    (_match, includePath) => {
      return `> Included content: ${includePath}`;
    },
  );
}

function transformEmbedBlocks(content) {
  return content.replace(
    /\{%\s*embed\s+url="([^"]+)"\s*%\}/g,
    (_match, url) => {
      return `[Embedded content](${url})`;
    },
  );
}

function rewriteGitbookAssetPaths(content) {
  return content.replace(
    /(?:\.\.\/|\.\/)*\.gitbook\/assets\//g,
    '/gitbook-assets/',
  );
}

function rewriteInternalMarkdownLinks(content, fileRelPath) {
  return content.replace(/\]\(([^)]+)\)/g, (match, rawTarget) => {
    const trimmed = rawTarget.trim().replace(/^<|>$/g, '');
    if (!trimmed) return match;

    const rewritten = rewriteLinkTarget(trimmed, fileRelPath);
    if (!rewritten) return match;
    return `](${rewritten})`;
  });
}

function rewriteLinkTarget(target, fileRelPath) {
  if (target.startsWith('http://') || target.startsWith('https://'))
    return target;
  if (target.startsWith('mailto:')) return target;
  if (target.startsWith('#')) return target;

  const anchorIndex = target.indexOf('#');
  const rawPath = anchorIndex === -1 ? target : target.slice(0, anchorIndex);
  const anchor = anchorIndex === -1 ? '' : target.slice(anchorIndex);

  if (!rawPath) return target;

  if (rawPath.includes('.gitbook/assets/')) {
    return rewriteGitbookAssetPaths(rawPath) + anchor;
  }

  if (!rawPath.toLowerCase().endsWith('.md')) return target;

  // Convert file-relative markdown links to site slugs.
  const currentDir = dirname(fileRelPath);
  const resolvedPath = normalizePosixPath(resolvePosix(currentDir, rawPath));
  const slug = slugFromSourcePath(resolvedPath);
  const normalizedSlug = slug ? `/${slug}` : '/';

  return `${normalizedSlug}${anchor}`;
}

function ensureFrontmatter(content, fileRelPath) {
  const title = inferTitle(content, fileRelPath);
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    return `---\ntitle: ${JSON.stringify(title)}\n---\n\n${content}`;
  }

  if (/^title\s*:/m.test(parsed.frontmatter)) {
    return content;
  }

  const frontmatterWithTitle = `title: ${JSON.stringify(title)}\n${parsed.frontmatter}`;
  return `---\n${frontmatterWithTitle}\n---${parsed.body}`;
}

function removeDuplicateTopHeading(content) {
  // Starlight renders `title` from frontmatter. Drop duplicate top-level headings when equal.
  const parsed = parseFrontmatter(content);
  if (!parsed) return content;

  const titleMatch = parsed.frontmatter.match(/^title\s*:\s*(.+)$/m);
  if (!titleMatch) return content;

  const frontmatterTitle = stripYamlString(titleMatch[1]);
  const headingMatch = parsed.body.match(/^\s*\n?#\s+(.+)\n?/);
  if (!headingMatch) return content;

  const headingTitle = headingMatch[1].trim();
  if (normalizeTitle(frontmatterTitle) !== normalizeTitle(headingTitle)) {
    return content;
  }

  const bodyWithoutHeading = parsed.body.replace(/^\s*\n?#\s+(.+)\n+/, '\n');
  return `---\n${parsed.frontmatter}\n---${bodyWithoutHeading}`;
}

function inferTitle(content, fileRelPath) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();

  const noExt = basename(fileRelPath, '.md');
  if (noExt.toLowerCase() === 'readme') {
    const parent = basename(dirname(fileRelPath));
    return titleCase(parent || 'Overview');
  }
  return titleCase(noExt);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/);
  if (!match) return null;
  return {
    frontmatter: match[1],
    body: match[2],
  };
}

function stripYamlString(rawValue) {
  return rawValue.trim().replace(/^['"]|['"]$/g, '');
}

function normalizeTitle(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function buildSidebarFromSummary(summaryText) {
  // SUMMARY.md is treated as the canonical nav tree from GitBook.
  const lines = summaryText.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  let stack = [];

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      currentSection = { label: heading[1].trim(), items: [] };
      sections.push(currentSection);
      stack = [];
      continue;
    }

    const itemMatch = line.match(/^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (!itemMatch || !currentSection) continue;

    const indent = itemMatch[1].length;
    const level = Math.floor(indent / 2);
    const node = {
      label: itemMatch[2].trim(),
      target: itemMatch[3].trim(),
      children: [],
    };

    if (level === 0) {
      currentSection.items.push(node);
      stack = [node];
      continue;
    }

    const parent = stack[level - 1];
    if (!parent) {
      currentSection.items.push(node);
      stack = [node];
      continue;
    }

    parent.children.push(node);
    stack[level] = node;
    stack.length = level + 1;
  }

  return sections
    .map((section) => ({
      label: section.label,
      items: section.items.map(convertSummaryNodeToSidebar).filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
}

function convertSummaryNodeToSidebar(node) {
  const linkItem = convertSummaryLink(node.label, node.target);
  const children = node.children
    .map(convertSummaryNodeToSidebar)
    .filter(Boolean);

  if (children.length > 0) {
    const overviewItem = linkItem ? { ...linkItem, label: 'Overview' } : null;
    const hasDuplicateOverview =
      overviewItem !== null &&
      children.some(
        (item) => sidebarItemKey(item) === sidebarItemKey(overviewItem),
      );
    const items =
      overviewItem && !hasDuplicateOverview
        ? [overviewItem, ...children]
        : children;

    return {
      label: node.label,
      collapsed: true,
      items,
    };
  }

  return linkItem;
}

function convertSummaryLink(label, target) {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return { label, link: target };
  }

  if (!target.toLowerCase().endsWith('.md')) {
    return { label, link: target };
  }

  const normalized = normalizePosixPath(target);
  const slug = slugFromSourcePath(normalized);
  if (!slug) {
    return { label, link: '/' };
  }

  return { label, slug };
}

function slugFromSourcePath(sourcePath) {
  const noExt = sourcePath.replace(/\.md$/i, '');
  if (noExt === 'README') return '';
  return noExt
    .replace(/\/README$/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function sidebarItemKey(item) {
  if (!item || typeof item !== 'object') return null;
  if ('slug' in item && item.slug) return `slug:${item.slug}`;
  if ('link' in item && item.link) return `link:${item.link}`;
  return null;
}

async function writeSidebarFile(filePath, sidebar) {
  const content = [
    "import type { StarlightUserConfig } from '@astrojs/starlight/types';",
    '',
    "type Sidebar = NonNullable<StarlightUserConfig['sidebar']>;",
    '',
    '// This file is auto-generated by scripts/sync-gitbook.mjs.',
    `export const sidebar: Sidebar = ${JSON.stringify(sidebar, null, 2)};`,
    '',
  ].join('\n');

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function writeManifest(filePath, manifest) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function countGeneratedFiles(docsDir, assetsDir) {
  const docsFiles = (await walkFiles(docsDir)).filter((file) =>
    file.endsWith('.md'),
  ).length;
  const assetFiles = (await walkFiles(assetsDir)).length;
  return { docsFiles, assetFiles };
}

async function walkFiles(startDir) {
  const files = [];
  const entries = await readdir(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = join(startDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absPath)));
    } else if (entry.isFile()) {
      files.push(absPath);
    }
  }

  return files;
}

function normalizePosixPath(pathValue) {
  return pathValue.replace(/\\/g, '/').replace(/^\.\//, '');
}

function resolvePosix(fromDir, targetPath) {
  const from = fromDir.split('/').filter(Boolean);
  const target = targetPath.split('/').filter(Boolean);

  if (targetPath.startsWith('/')) {
    return target.join('/');
  }

  const stack = [...from];
  for (const part of target) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join('/');
}

function titleCase(input) {
  return input
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

async function readLockConfig(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== 'object') return {};

    const repo = typeof parsed.repo === 'string' ? parsed.repo : undefined;
    const ref = typeof parsed.ref === 'string' ? parsed.ref : undefined;
    return { repo, ref };
  } catch {
    return {};
  }
}

async function cloneSourceRepo(sourceDir, url, ref) {
  // `git clone --branch` cannot target arbitrary commit SHAs.
  // Branch/tag refs use clone --branch; SHA refs use clone + detached checkout.
  if (!isCommitSha(ref)) {
    execFileSync(
      'git',
      ['clone', '--depth', '1', '--branch', ref, url, sourceDir],
      {
        stdio: 'inherit',
      },
    );
    return;
  }

  execFileSync('git', ['clone', '--depth', '1', url, sourceDir], {
    stdio: 'inherit',
  });

  try {
    execFileSync('git', ['-C', sourceDir, 'checkout', '--detach', ref], {
      stdio: 'inherit',
    });
    return;
  } catch {
    execFileSync(
      'git',
      ['-C', sourceDir, 'fetch', '--depth', '1', 'origin', ref],
      {
        stdio: 'inherit',
      },
    );
    execFileSync(
      'git',
      ['-C', sourceDir, 'checkout', '--detach', 'FETCH_HEAD'],
      {
        stdio: 'inherit',
      },
    );
  }
}

function isCommitSha(value) {
  return /^[0-9a-f]{40}$/i.test(value);
}
