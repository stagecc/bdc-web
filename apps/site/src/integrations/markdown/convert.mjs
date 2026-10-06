import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { strikethrough } from 'turndown-plugin-gfm';

function textElement(document, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function expandCollections(document, main, collections) {
  const fellows = main.querySelector(
    'astro-island[component-export="FellowsGrid"]',
  );
  if (fellows) {
    if (!collections.fellows?.length)
      throw new Error('Missing fellows export data');
    const section = document.createElement('section');
    for (const fellow of [...collections.fellows].sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      section.append(textElement(document, 'h2', fellow.name));
      if (fellow.photo?.src) {
        const photo = document.createElement('img');
        photo.setAttribute('src', fellow.photo.src);
        photo.setAttribute('alt', fellow.name);
        section.append(photo);
      }
      section.append(
        textElement(
          document,
          'p',
          `${fellow.university} — Cohort ${fellow.cohort}`,
        ),
      );
      section.append(textElement(document, 'p', fellow.bio));
      section.append(textElement(document, 'h3', fellow.project.title));
      section.append(textElement(document, 'p', fellow.project.abstract));
    }
    fellows.replaceWith(section);
  }
  const publications = main.querySelector('#publications-explorer');
  if (publications) {
    if (!collections.publications?.length)
      throw new Error('Missing publications export data');
    publications.replaceChildren(textElement(document, 'h2', 'Publications'));
    const sorted = [...collections.publications].sort(
      (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
    );
    for (const publication of sorted) {
      const heading = document.createElement('h3');
      const link = textElement(document, 'a', publication.title);
      link.setAttribute('href', publication.url);
      heading.append(link);
      publications.append(heading);
      publications.append(
        textElement(
          document,
          'p',
          `${publication.journalName} — ${publication.date.slice(0, 10)}`,
        ),
      );
      for (const [key, label] of Object.entries({
        status: 'Status',
        bdcContribution: 'BDC contribution',
        researchArea: 'Research area',
        researchCommunity: 'Research community',
      })) {
        if (publication[key]?.length) {
          const value = Array.isArray(publication[key])
            ? publication[key].join(', ')
            : publication[key];
          publications.append(textElement(document, 'p', `${label}: ${value}`));
        }
      }
    }
  }
}

export function convertPage(html, { url, collections = {} }) {
  const dom = new JSDOM(html);
  try {
    const { document } = dom.window;
    const main = document.querySelector('main#main-content');
    if (!main) {
      if (document.querySelector('meta[http-equiv="refresh" i]')) return null;
      throw new Error(`Missing main content: ${url}`);
    }
    expandCollections(document, main, collections);
    main
      .querySelectorAll(
        'script, style, template, svg, nav, .usa-in-page-nav, [data-markdown-exclude], [aria-hidden="true"], input, select, textarea',
      )
      .forEach((node) => {
        node.remove();
      });
    main.querySelectorAll('button').forEach((button) => {
      if (button.hasAttribute('aria-controls')) {
        button.replaceWith(...button.childNodes);
      } else {
        button.remove();
      }
    });
    for (const element of main.querySelectorAll('[href], [src]')) {
      for (const attribute of ['href', 'src']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const resolved = new URL(value, url);
        if (
          ['https:', 'http:', 'mailto:', 'tel:'].includes(resolved.protocol)
        ) {
          element.setAttribute(attribute, resolved.href);
        } else {
          element.removeAttribute(attribute);
        }
      }
    }
    const converter = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
    const escapeMarkdown = converter.escape.bind(converter);
    converter.escape = (text) => escapeMarkdown(text).replace(/</g, '\\<');
    converter.use(strikethrough);
    converter.addRule('table', {
      filter: 'table',
      replacement: (_content, node) => {
        const rows = [...node.rows].map((row) =>
          [...row.cells].map((cell) =>
            converter
              .turndown(cell)
              .replace(/\|/g, '\\|')
              .replace(/\s*\n\s*/g, ' '),
          ),
        );
        if (!rows.length) return '';
        const width = Math.max(...rows.map((row) => row.length));
        const header = node.rows[0].querySelector('th')
          ? rows.shift()
          : Array(width).fill('');
        const line = (cells) =>
          `| ${Array.from({ length: width }, (_, i) => cells[i] || '').join(' | ')} |`;
        return `\n\n${[line(header), line(Array(width).fill('---')), ...rows.map(line)].join('\n')}\n\n`;
      },
    });
    converter.addRule('lineBreak', { filter: 'br', replacement: () => '  \n' });
    const body = converter.turndown(main);
    const title = converter.escape(document.title || 'Untitled');
    const heading = main.querySelector('h1') ? '' : `# ${title}\n\n`;
    return `${heading}Source: ${url}\n\n${body}\n`;
  } finally {
    dom.window.close();
  }
}
