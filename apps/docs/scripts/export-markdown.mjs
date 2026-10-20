import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dump, load } from 'js-yaml';
import { isMarkdownExportIgnored } from '../../../markdown-export.config.mjs';

const gitbookUrl =
  'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation/';

export function addSource(markdown, path) {
  const frontmatter = markdown.match(
    /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  );
  const metadata = (frontmatter ? load(frontmatter[1]) : {}) ?? {};
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(`Invalid frontmatter in ${path}`);
  }
  const route = path
    .split(sep)
    .join('/')
    .replace(/\.mdx?$/, '')
    .replace(/(^|\/)index$/, '$1');
  const source = metadata?.source_url ?? new URL(route, gitbookUrl).href;
  const parsed = new URL(source);
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`Invalid source URL in ${path}`);
  }
  const prefix = frontmatter?.[0] ?? '';
  const body = markdown.slice(prefix.length);
  const title =
    typeof metadata.title === 'string' && metadata.title.trim()
      ? metadata.title
      : body.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
        path
          .replace(/\.mdx?$/, '')
          .split('/')
          .pop();
  const { title: _title, url: _url, ...extra } = metadata;
  const yaml = dump(
    { title, url: parsed.href, ...extra },
    { lineWidth: -1, noRefs: true },
  );
  const newline = markdown.includes('\r\n') ? '\r\n' : '\n';
  return `---${newline}${yaml.replace(/\n/g, newline)}---${newline}${body}`;
}

async function exportFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await exportFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

export async function exportMarkdown(source, output) {
  await access(join(source, 'index.md'));
  const files = (await exportFiles(source)).filter(
    (file) =>
      !isMarkdownExportIgnored(
        'docs',
        relative(source, file).split(sep).join('/'),
      ),
  );
  const originalPaths = new Set(
    files.map((file) => relative(source, file).split(sep).join('/')),
  );
  const pages = await Promise.all(
    files.map(async (file) => {
      const path = relative(source, file).split(sep).join('/');
      const flattened = path.replace(/\/index(\.mdx?)$/, '$1');
      // Preserve both documents if a sibling already owns the flattened name.
      const destination = originalPaths.has(flattened) ? path : flattened;
      return {
        file,
        destination,
        content: /\.mdx?$/.test(path)
          ? addSource(await readFile(file, 'utf8'), path)
          : null,
      };
    }),
  );
  await rm(output, { recursive: true, force: true });
  for (const page of pages) {
    const destination = join(output, page.destination);
    await mkdir(dirname(destination), { recursive: true });
    if (page.content === null) await cp(page.file, destination);
    else await writeFile(destination, page.content);
  }
  return pages.filter((page) => page.content !== null).length;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const count = await exportMarkdown(
    join(root, 'src/content/docs'),
    join(root, 'dist/markdown'),
  );
  console.log(`Exported ${count} Markdown pages with source links.`);
}
