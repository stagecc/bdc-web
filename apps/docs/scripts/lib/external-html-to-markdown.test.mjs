import { describe, expect, it } from 'vitest';
import { convertExternalHtmlToMarkdown } from './external-html-to-markdown.mjs';

describe('convertExternalHtmlToMarkdown', () => {
  it('converts headings and links into markdown', () => {
    const html =
      '<h2 id="overview">Overview</h2><p>Read <a href="https://example.com">more</a>.</p>';

    const output = convertExternalHtmlToMarkdown(html);

    expect(output).toContain('## Overview');
    expect(output).toContain('[more](https://example.com)');
  });

  it('drops readme heading anchor helper elements', () => {
    const html =
      '<h2><div class="heading-anchor anchor waypoint" id="overview"></div><div class="heading-text"><div id="section-overview" class="heading-anchor_backwardsCompatibility"></div>Overview</div><a class="heading-anchor-icon" href="#overview">#</a></h2>';

    const output = convertExternalHtmlToMarkdown(html);

    expect(output).toContain('## Overview');
    expect(output).not.toContain('heading-anchor-icon');
    expect(output).not.toContain('#overview');
  });
});
