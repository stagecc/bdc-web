import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { convertPage } from './convert.mjs';
import markdownExport from './index.mjs';

const url = 'https://example.org/about/';
const page = (content) =>
  `<html><head><title>Example</title></head><body><header>Navigation</header><main id="main-content">${content}</main><footer>Updated today</footer></body></html>`;

test('exports semantic content, collapsed answers and absolute links without UI or HTML', () => {
  const html =
    page(`<h1>Title</h1><aside class="usa-in-page-nav">On this page</aside>
    <h2><button aria-controls="answer">Question?</button></h2><div id="answer" hidden>Answer</div>
    <p><a href="/help">Help</a> <img src="../photo.png" alt="Photo"></p>
    <astro-island><p>Rendered island</p></astro-island>
    <p>First<br>Second</p><script>secret()</script><style>.test{}</style>
    <button>Load more</button><svg><title>Icon</title></svg>`);
  const result = convertPage(html, { url });
  assert.match(result, /# Title/);
  assert.match(result, /## Question\?/);
  assert.match(result, /Answer/);
  assert.match(result, /\[Help\]\(https:\/\/example.org\/help\)/);
  assert.match(result, /!\[Photo\]\(https:\/\/example.org\/photo.png\)/);
  assert.match(result, /Rendered island/);
  assert.doesNotMatch(
    result,
    /Navigation|Updated today|On this page|secret|Load more|Icon|<\/?[a-z]/i,
  );
  assert.equal(result, convertPage(html, { url }));
});

test('exports tables without headers as Markdown and preserves code', () => {
  const result = convertPage(
    page(
      '<table><tr><td>A | B</td><td>C</td></tr></table><pre><code>const a = 1;</code></pre>',
    ),
    { url },
  );
  assert.match(result, /\| --- \| --- \|/);
  assert.match(result, /A \\\| B/);
  assert.match(result, /```\nconst a = 1;\n```/);
  assert.doesNotMatch(result, /<table|<br/);
});

test('exports every publication and client-only fellow details', () => {
  const collections = {
    fellows: [
      {
        name: 'Jane Doe',
        university: 'University',
        cohort: 'I',
        bio: 'Full biography',
        project: { title: 'Project', abstract: 'Full abstract' },
      },
    ],
    publications: Array.from({ length: 25 }, (_, i) => ({
      title: `Publication ${i}`,
      date: '2026-01-01',
      journalName: 'Journal',
      url: `https://example.org/p/${i}`,
    })),
  };
  const result = convertPage(
    page(
      '<astro-island component-export="FellowsGrid"></astro-island><section id="publications-explorer">First page only</section>',
    ),
    { url, collections },
  );
  assert.match(result, /Full biography/);
  assert.match(result, /Full abstract/);
  assert.match(result, /Publication 24/);
  assert.equal((result.match(/### \[Publication/g) || []).length, 25);
  assert.doesNotMatch(result, /First page only/);
});

test('fails on missing content but skips redirects', () => {
  assert.throws(() => convertPage('<html></html>', { url }), /Missing main/);
  assert.equal(
    convertPage('<meta http-equiv="refresh" content="0;url=/new">', { url }),
    null,
  );
  assert.throws(
    () =>
      convertPage(page('<section id="publications-explorer"></section>'), {
        url,
      }),
    /Missing publications/,
  );
});

test('escapes literal HTML-like text while retaining code samples', () => {
  const result = convertPage(
    page(
      '<p>Literal &lt;em&gt;word&lt;/em&gt;</p><pre><code>&lt;div&gt;</code></pre>',
    ),
    { url },
  );
  assert.match(result, /Literal \\<em>word\\<\/em>/);
  assert.match(result, /```\n<div>\n```/);
});

test('build hook writes nested files, removes stale output and consumes temporary data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bdc-markdown-'));
  try {
    await mkdir(join(root, 'about'));
    await mkdir(join(root, 'markdown'));
    await writeFile(join(root, 'markdown', 'stale.md'), 'stale');
    await writeFile(join(root, 'index.html'), page('<h1>Home</h1>'));
    await writeFile(join(root, 'about', 'index.html'), page('<h1>About</h1>'));
    await writeFile(join(root, '__markdown-collections.json'), '{}');
    const integration = markdownExport();
    const routes = [];
    integration.hooks['astro:config:setup']({
      command: 'dev',
      injectRoute: (route) => routes.push(route),
    });
    assert.equal(routes.length, 0);
    integration.hooks['astro:config:setup']({
      command: 'build',
      injectRoute: (route) => routes.push(route),
    });
    assert.equal(routes.length, 1);
    integration.hooks['astro:config:done']({
      config: { site: 'https://example.org' },
    });
    await integration.hooks['astro:build:done']({
      dir: pathToFileURL(`${root}/`),
      logger: { info() {} },
    });
    assert.match(
      await readFile(join(root, 'markdown', 'about', 'index.md'), 'utf8'),
      /Source: https:\/\/example.org\/about\//,
    );
    await assert.rejects(readFile(join(root, '__markdown-collections.json')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(root, 'markdown', 'stale.md')), {
      code: 'ENOENT',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
