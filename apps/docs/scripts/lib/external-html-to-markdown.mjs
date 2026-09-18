import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
});

turndown.use(gfm);

turndown.addRule('dropHeadingAnchorElements', {
  filter(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.nodeName !== 'A' && node.nodeName !== 'DIV') return false;
    const className = node.getAttribute('class') ?? '';
    return (
      className.includes('heading-anchor-icon') ||
      className.includes('heading-anchor_backwardsCompatibility') ||
      className.includes('heading-anchor anchor waypoint')
    );
  },
  replacement() {
    return '';
  },
});

turndown.addRule('flattenReadmeImageWrapper', {
  filter(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.nodeName !== 'SPAN') return false;
    const className = node.getAttribute('class') ?? '';
    return className.includes('img lightbox');
  },
  replacement(_content, node) {
    const img = node.querySelector('img');
    if (!img) return '';
    const alt = img.getAttribute('alt') ?? '';
    const src = img.getAttribute('src') ?? '';
    const title = img.getAttribute('title') ?? '';

    if (!src) return '';
    const escapedAlt = alt.replace(/\]/g, '\\]');
    const escapedTitle = title.replace(/"/g, '\\"');
    return title
      ? `![${escapedAlt}](${src} "${escapedTitle}")`
      : `![${escapedAlt}](${src})`;
  },
});

export function convertExternalHtmlToMarkdown(html) {
  if (typeof html !== 'string' || html.trim() === '') return '';

  const normalized = html
    .replace(/<\/?span[^>]*class="__cf_email__"[^>]*>/gi, '')
    .replace(/<\/?span[^>]*data-testid=".*?"[^>]*>/gi, '');

  return turndown
    .turndown(normalized)
    .replace(/^(#{1,6})\s*\n+\s*([^\n].*)$/gm, '$1 $2')
    .trim();
}
