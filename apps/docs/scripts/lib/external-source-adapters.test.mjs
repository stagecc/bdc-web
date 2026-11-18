import { describe, expect, it } from 'vitest';
import { convertExternalHtmlToMarkdown } from './external-html-to-markdown.mjs';
import { decodeCloudflareEmails } from './external-source-adapters.mjs';

const first = '9eedebeeeef1eceadeedfcf9fbf0f1f3f7fdedb0fdf1f3';
const second = '077472777768757347746271626965756e636062742964686a';
const third = 'e89b9d9898879a9ca89b8d9e8d868a9a818c8f8d9bc68b8785';
const link = (encoded, label) =>
  `<a href="https://sb-biodatacatalyst.readme.io/cdn-cgi/l/email-protection#${encoded}">${label}</a>`;

describe('decodeCloudflareEmails', () => {
  it('restores the reported addresses and preserves descriptive labels in Markdown', () => {
    const html = [
      link(first, '[email\u00a0protected]'),
      link(second, 'support team'),
      link(third, 'Seven Bridges Support team'),
    ].join(' ');
    const markdown = convertExternalHtmlToMarkdown(
      decodeCloudflareEmails(html),
    );
    expect(markdown).toContain(
      '[support@sbgenomics.com](mailto:support@sbgenomics.com)',
    );
    expect(markdown).toContain(
      '[support team](mailto:support@sevenbridges.com)',
    );
    expect(markdown).toContain(
      '[Seven Bridges Support team](mailto:support@sevenbridges.com)',
    );
    expect(markdown).not.toContain('email-protection');
    expect(markdown).not.toContain('protected');
  });

  it('decodes standalone and nested spans with single-quoted attributes', () => {
    const span = `<span class='__cf_email__' data-cfemail='${second}'>[email protected]</span>`;
    expect(convertExternalHtmlToMarkdown(decodeCloudflareEmails(span))).toBe(
      'support@sevenbridges.com',
    );
    expect(
      convertExternalHtmlToMarkdown(decodeCloudflareEmails(link(second, span))),
    ).toBe('[support@sevenbridges.com](mailto:support@sevenbridges.com)');
  });

  it('normalizes different encoding keys to identical content for hashing', () => {
    const html = (encoded) =>
      link(
        encoded,
        `<span class="__cf_email__" data-cfemail="${encoded}">[email protected]</span>`,
      );
    expect(decodeCloudflareEmails(html(second))).toBe(
      decodeCloudflareEmails(html(third)),
    );
  });

  it('preserves ordinary emails and unrecoverable placeholders', () => {
    const html =
      '<p><a href="mailto:help@example.org">Help</a> [email protected]</p>';
    expect(decodeCloudflareEmails(html)).toBe(html);
    for (const encoded of ['0', 'zz', '0000']) {
      expect(decodeCloudflareEmails(link(encoded, '[email protected]'))).toBe(
        link(encoded, '[email protected]'),
      );
    }
  });
});
