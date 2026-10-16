import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { load } from 'js-yaml';
import { convertPage } from './convert.mjs';
import markdownExport from './index.mjs';

const url = 'https://example.org/about/';
const page = (content) =>
  `<html><head><title>Example</title></head><body><header>Navigation</header><main id="main-content">${content}</main><footer>Updated today</footer></body></html>`;

test('exports event and publication dates from page headers as YYYY-MM-DD', () => {
  for (const headerClass of ['event__header', 'article__header']) {
    const result = convertPage(
      page(`<aside><time datetime="2026-01-01T00:00:00.000Z">Related date</time></aside>
        <header class="${headerClass}"><h1>Title</h1>
          <time datetime="2025-06-23T00:00:00.000Z">June 23, 2025</time>
        </header><p>Content</p>`),
      { url },
    );
    const frontmatter = result.match(/^---\n([\s\S]*?)\n---\n/);
    assert.equal(load(frontmatter[1]).date, '2025-06-23');
    assert.match(result.slice(frontmatter[0].length), /June 23, 2025/);
  }
  const listing = convertPage(
    page('<h1>Events</h1><time datetime="2025-06-23">Listed event date</time>'),
    { url },
  );
  assert.equal(
    load(listing.match(/^---\n([\s\S]*?)\n---\n/)[1]).date,
    undefined,
  );
});

test('moves page tags into YAML without collecting tags from related articles', () => {
  const result = convertPage(
    page(`<h1>Reception Desk</h1>
      <div data-markdown-tags='["BDC User Support", "Topic: data", "BDC User Support"]'>
        <a href="/tagged/BDC%20User%20Support">BDC User Support</a>
      </div>
      <p>Event details.</p>
      <aside><a href="/tagged/Other">Related article tag</a></aside>`),
    { url },
  );
  const frontmatter = result.match(/^---\n([\s\S]*?)\n---\n/);
  assert.deepEqual(load(frontmatter[1]), {
    title: 'Reception Desk',
    url,
    tags: ['BDC User Support', 'Topic: data'],
  });
  const body = result.slice(frontmatter[0].length);
  assert.doesNotMatch(body, /BDC User Support/);
  assert.match(body, /Event details/);
  assert.match(body, /Related article tag/);
});

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
    await mkdir(join(root, 'tagged', 'BDC User Support'), { recursive: true });
    await mkdir(join(root, 'markdown', 'tagged'), { recursive: true });
    await writeFile(
      join(root, 'markdown', 'tagged', 'old.md'),
      'old tag listing',
    );
    const tagListing = page('<h1>Tagged BDC User Support</h1>');
    await writeFile(
      join(root, 'tagged', 'BDC User Support', 'index.html'),
      tagListing,
    );
    await writeFile(join(root, 'markdown', 'stale.md'), 'stale');
    await writeFile(join(root, 'index.html'), page('<h1>Home</h1>'));
    await writeFile(join(root, '404.html'), page('<h1>Not found</h1>'));
    await writeFile(join(root, 'markdown', '404.md'), 'old error page');
    await writeFile(
      join(root, '404-help.html'),
      page('<h1>Error guidance</h1>'),
    );
    await mkdir(join(root, 'tagged-help'));
    await writeFile(
      join(root, 'tagged-help', 'index.html'),
      page('<h1>Tag help</h1>'),
    );
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
      await readFile(join(root, 'markdown', 'about.md'), 'utf8'),
      /url: https:\/\/example.org\/about\//,
    );
    await assert.rejects(
      readFile(join(root, 'markdown', 'about', 'index.md')),
      { code: 'ENOENT' },
    );
    await assert.rejects(readFile(join(root, '__markdown-collections.json')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(root, 'markdown', 'stale.md')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(root, 'markdown', '404.md')), {
      code: 'ENOENT',
    });
    assert.match(await readFile(join(root, '404.html'), 'utf8'), /Not found/);
    assert.match(
      await readFile(join(root, 'markdown', '404-help.md'), 'utf8'),
      /Error guidance/,
    );
    assert.match(
      await readFile(join(root, 'markdown', 'tagged-help.md'), 'utf8'),
      /Tag help/,
    );
    await assert.rejects(
      readFile(join(root, 'markdown', 'tagged', 'BDC User Support.md')),
      {
        code: 'ENOENT',
      },
    );
    await assert.rejects(readFile(join(root, 'markdown', 'tagged', 'old.md')), {
      code: 'ENOENT',
    });
    assert.equal(
      await readFile(
        join(root, 'tagged', 'BDC User Support', 'index.html'),
        'utf8',
      ),
      tagListing,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('writes YAML title and URL with safe escaping and a title fallback', () => {
  for (const [html, title] of [
    [page('<h1>A: "quoted" title #1</h1><p>Body</p>'), 'A: "quoted" title #1'],
    [page('<p>Body</p>'), 'Example'],
  ]) {
    const result = convertPage(html, { url });
    const frontmatter = result.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(frontmatter);
    assert.deepEqual(load(frontmatter[1]), { title, url });
    assert.doesNotMatch(result.slice(frontmatter[0].length), /^Source:/m);
  }
});
