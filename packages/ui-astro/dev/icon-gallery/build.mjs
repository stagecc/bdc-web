import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageRoot = resolve(__dirname, '../..');
const customIconsPath = join(packageRoot, 'src/icon/custom-icons.ts');
const spritePath = join(packageRoot, 'src/icon/sprite.svg');
const distDir = join(__dirname, 'dist');

mkdirSync(distDir, { recursive: true });

const customIcons = loadCustomIcons(customIconsPath);
const uswdsIcons = loadUswdsIconNames(spritePath);

const html = renderHtml({ customIcons, uswdsIcons });
writeFileSync(join(distDir, 'index.html'), html, 'utf8');

console.log(
  `Generated icon gallery with ${uswdsIcons.length} USWDS icons and ${Object.keys(customIcons).length} custom icons: ${join(distDir, 'index.html')}`,
);

function loadCustomIcons(filePath) {
  const source = readFileSync(filePath, 'utf8');

  const executable = source
    .replace(/export interface[\s\S]*?}\n\n/m, '')
    .replace(': Record<string, CustomIconDefinition>', '')
    .replace('export const customIcons', 'const customIcons');

  return Function(`${executable}\nreturn customIcons;`)();
}

function loadUswdsIconNames(filePath) {
  const sprite = readFileSync(filePath, 'utf8');
  return Array.from(sprite.matchAll(/<symbol\s+id="([^"]+)"/g), (match) => match[1]).sort();
}

function renderHtml({ customIcons, uswdsIcons }) {
  const customIconNames = Object.keys(customIcons).sort();
  const allIconNames = Array.from(new Set([...uswdsIcons, ...customIconNames])).sort();

  const customCards = customIconNames
    .map((name) => {
      const icon = customIcons[name];
      const viewBox = icon.viewBox ?? '0 0 24 24';
      const paths = icon.paths
        .map((path) => `<path d="${escapeHtml(path)}" fill="currentColor"></path>`)
        .join('');

      return `
        <article class="card" data-icon-card data-icon-name="${escapeHtml(name)}" data-icon-set="custom">
          <div class="glyph-wrap"><svg class="glyph" viewBox="${viewBox}" aria-hidden="true">${paths}</svg></div>
          <code class="icon-name">${escapeHtml(name)}</code>
          <p class="meta">custom</p>
        </article>
      `;
    })
    .join('');

  const uswdsCards = uswdsIcons
    .map(
      (name) => `
        <article class="card" data-icon-card data-icon-name="${escapeHtml(name)}" data-icon-set="uswds">
          <div class="glyph-wrap"><svg class="glyph" aria-hidden="true"><use href="../../../src/icon/sprite.svg#${escapeHtml(name)}"></use></svg></div>
          <code class="icon-name">${escapeHtml(name)}</code>
          <p class="meta">uswds</p>
        </article>
      `,
    )
    .join('');

  const compareRows = allIconNames
    .map((name) => {
      const customIcon = customIcons[name];
      const hasCustom = Boolean(customIcon);
      const hasUswds = uswdsIcons.includes(name);

      const customSvg = hasCustom
        ? `<svg class="glyph glyph--small" viewBox="${customIcon.viewBox ?? '0 0 24 24'}" aria-hidden="true">${customIcon.paths
            .map((path) => `<path d="${escapeHtml(path)}" fill="currentColor"></path>`)
            .join('')}</svg>`
        : '<span class="missing">-</span>';

      const uswdsSvg = hasUswds
        ? `<svg class="glyph glyph--small" aria-hidden="true"><use href="../../../src/icon/sprite.svg#${escapeHtml(name)}"></use></svg>`
        : '<span class="missing">-</span>';

      return `
        <tr data-icon-row data-icon-name="${escapeHtml(name)}">
          <th scope="row"><code>${escapeHtml(name)}</code></th>
          <td>${uswdsSvg}</td>
          <td>${customSvg}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Icon Gallery</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
        margin: 0;
        background: linear-gradient(180deg, #f7fbff 0%, #ffffff 35%, #f7fbff 100%);
        color: #1b1b1b;
      }

      .container {
        margin: 0 auto;
        max-width: 1200px;
        padding: 2rem 1.2rem 3rem;
      }

      h1,
      h2 {
        color: #0a2b61;
        margin: 0;
      }

      h1 {
        font-size: 2rem;
      }

      h2 {
        border-top: 1px solid #dfe1e2;
        margin-top: 2.25rem;
        padding-top: 1.3rem;
        font-size: 1.35rem;
      }

      p {
        line-height: 1.5;
      }

      .summary {
        color: #3d4551;
        margin: 0.8rem 0 0;
      }

      .search {
        margin-top: 1rem;
      }

      .search input {
        width: min(420px, 100%);
        border: 1px solid #c9c9c9;
        border-radius: 0.4rem;
        padding: 0.55rem 0.65rem;
        font: inherit;
      }

      .grid {
        display: grid;
        gap: 0.85rem;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        margin-top: 1rem;
      }

      .card {
        border: 1px solid #dfe1e2;
        border-radius: 0.5rem;
        background: #fff;
        padding: 0.8rem;
      }

      .glyph-wrap {
        background: #f0f6ff;
        border-radius: 0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 3.3rem;
        margin-bottom: 0.7rem;
      }

      .glyph {
        width: 1.5rem;
        height: 1.5rem;
        fill: currentColor;
        color: #1a4480;
      }

      .glyph--small {
        width: 1.2rem;
        height: 1.2rem;
      }

      .icon-name {
        font-size: 0.72rem;
        display: block;
        line-break: anywhere;
      }

      .meta {
        margin: 0.35rem 0 0;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #4f5d73;
      }

      .table-wrap {
        border: 1px solid #dfe1e2;
        border-radius: 0.5rem;
        margin-top: 1rem;
        overflow: auto;
        background: #fff;
      }

      table {
        border-collapse: collapse;
        min-width: 460px;
        width: 100%;
      }

      th,
      td {
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid #f0f0f0;
        text-align: left;
      }

      thead th {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #4f5d73;
      }

      tbody tr:last-child th,
      tbody tr:last-child td {
        border-bottom: 0;
      }

      .missing {
        color: #8b949e;
      }
    </style>
  </head>
  <body>
    <main class="container">
      <h1>BDC Icon Gallery</h1>
      <p class="summary">USWDS icons: ${uswdsIcons.length} · Custom icons: ${customIconNames.length}. Generated from live source files.</p>
      <div class="search">
        <label for="icon-search">Search icons</label><br />
        <input id="icon-search" type="search" placeholder="Try: search, cloud, account..." autocomplete="off" />
      </div>

      <h2>Custom Icons</h2>
      <div class="grid">${customCards}</div>

      <h2>USWDS Icons</h2>
      <div class="grid">${uswdsCards}</div>

      <h2>Name Alignment Matrix</h2>
      <p class="summary">Use this to compare same-name icons across sets and catch overlap gaps.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th>uswds</th>
              <th>custom</th>
            </tr>
          </thead>
          <tbody>
            ${compareRows}
          </tbody>
        </table>
      </div>
    </main>
    <script>
      const search = document.getElementById('icon-search');
      const cards = Array.from(document.querySelectorAll('[data-icon-card]'));
      const rows = Array.from(document.querySelectorAll('[data-icon-row]'));

      const filter = () => {
        const query = (search.value || '').trim().toLowerCase();

        for (const card of cards) {
          const name = (card.dataset.iconName || '').toLowerCase();
          const set = (card.dataset.iconSet || '').toLowerCase();
          const visible = query === '' || name.includes(query) || set.includes(query);
          card.hidden = !visible;
        }

        for (const row of rows) {
          const name = (row.dataset.iconName || '').toLowerCase();
          row.hidden = !(query === '' || name.includes(query));
        }
      };

      search.addEventListener('input', filter);
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
