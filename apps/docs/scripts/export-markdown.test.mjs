import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { expect, it } from 'vitest';
import { addSource, exportMarkdown } from './export-markdown.mjs';

function metadata(result) {
  return load(result.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
}

it('writes title and url while preserving other metadata and the body', () => {
  const input =
    '---\ntitle: Guide\ndescription: A guide\n---\n\n:::note\nContent\n:::\n';
  const result = addSource(input, 'guide/index.md');
  expect(metadata(result)).toEqual({
    title: 'Guide',
    url: 'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation/guide/',
    description: 'A guide',
  });
  expect(result.endsWith('\n:::note\nContent\n:::\n')).toBe(true);
  expect(result).not.toMatch(/^Source:/m);
});

it('uses canonical external URLs and safely serializes special titles', () => {
  for (const url of [
    'https://support.terra.bio/hc/en-us/articles/123',
    'https://sb-biodatacatalyst.readme.io/docs/start',
  ]) {
    const input = `---\ntitle: 'Start: "here" #1'\nsource_url: "${url}"\n---\n\nBody`;
    expect(metadata(addSource(input, 'external/start.md'))).toEqual({
      title: 'Start: "here" #1',
      url,
      source_url: url,
    });
  }
});

it('handles the homepage, CRLF and missing titles', () => {
  expect(metadata(addSource('# Home', 'index.md'))).toEqual({
    title: 'Home',
    url: 'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation/',
  });
  const crlf = addSource('---\r\ntitle: Test\r\n---\r\nBody', 'a.md');
  expect(crlf.startsWith('---\r\n')).toBe(true);
  expect(metadata(crlf).title).toBe('Test');
  expect(metadata(addSource('---\ntitle: Test\n---', 'a.md')).title).toBe(
    'Test',
  );
  expect(metadata(addSource('Body', 'guide/start.md')).title).toBe('start');
});

it('rejects invalid source URLs', () => {
  expect(() =>
    addSource('---\nsource_url: javascript:alert(1)\n---\n', 'a.md'),
  ).toThrow('Invalid source');
});

it('leaves originals unchanged, removes obsolete output and is repeatable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'docs-source-test-'));
  const source = join(root, 'source');
  const output = join(root, 'output');
  try {
    await mkdir(source);
    await mkdir(output);
    await writeFile(join(source, 'index.md'), '# Home');
    await writeFile(join(source, '404.md'), '# Not found');
    await writeFile(join(output, '404.md'), 'old error page');
    await mkdir(join(source, '404'));
    await writeFile(join(source, '404', 'index.mdx'), '# Nested error page');
    await writeFile(join(output, 'stale.md'), 'obsolete');
    expect(await exportMarkdown(source, output)).toBe(1);
    const first = await readFile(join(output, 'index.md'), 'utf8');
    expect(await readFile(join(source, 'index.md'), 'utf8')).toBe('# Home');
    expect(await readFile(join(source, '404.md'), 'utf8')).toBe('# Not found');
    await expect(readFile(join(output, '404.md'))).rejects.toHaveProperty(
      'code',
      'ENOENT',
    );
    await expect(readFile(join(output, '404.mdx'))).rejects.toHaveProperty(
      'code',
      'ENOENT',
    );
    await expect(
      readFile(join(output, '404', 'index.mdx')),
    ).rejects.toHaveProperty('code', 'ENOENT');
    await expect(readFile(join(output, 'stale.md'))).rejects.toHaveProperty(
      'code',
      'ENOENT',
    );
    await exportMarkdown(source, output);
    expect(await readFile(join(output, 'index.md'), 'utf8')).toBe(first);
    await rm(join(source, 'index.md'));
    await expect(exportMarkdown(source, output)).rejects.toThrow();
    expect(await readFile(join(output, 'index.md'), 'utf8')).toBe(first);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it('flattens nested indexes, preserves children and assets, and avoids collisions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'docs-path-test-'));
  const source = join(root, 'source');
  const output = join(root, 'output');
  try {
    await mkdir(join(source, 'guide'), { recursive: true });
    await mkdir(join(source, 'support'));
    await writeFile(join(source, 'index.md'), '# Home');
    await writeFile(join(source, 'guide', 'index.md'), '# Guide');
    await writeFile(join(source, 'guide', 'child.md'), '# Child');
    await writeFile(join(source, 'guide', 'asset.txt'), 'asset');
    await writeFile(join(source, 'support.md'), '# Existing support');
    await writeFile(join(source, 'support', 'index.md'), '# Other support');
    await exportMarkdown(source, output);
    const guide = await readFile(join(output, 'guide.md'), 'utf8');
    expect(metadata(guide).url).toBe(
      'https://bdcatalyst.gitbook.io/biodata-catalyst-documentation/guide/',
    );
    expect(await readFile(join(output, 'guide', 'child.md'), 'utf8')).toContain(
      '# Child',
    );
    expect(await readFile(join(output, 'guide', 'asset.txt'), 'utf8')).toBe(
      'asset',
    );
    expect(await readFile(join(output, 'support.md'), 'utf8')).toContain(
      '# Existing support',
    );
    expect(
      await readFile(join(output, 'support', 'index.md'), 'utf8'),
    ).toContain('# Other support');
    await expect(
      readFile(join(output, 'guide', 'index.md')),
    ).rejects.toHaveProperty('code', 'ENOENT');
    expect(await readFile(join(source, 'guide', 'index.md'), 'utf8')).toBe(
      '# Guide',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
