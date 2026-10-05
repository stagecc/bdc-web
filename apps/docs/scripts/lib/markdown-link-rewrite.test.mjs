import { describe, expect, it } from 'vitest';
import { rewriteMarkdownLinkDestinations } from './markdown-link-rewrite.mjs';

describe('rewriteMarkdownLinkDestinations', () => {
  it('rewrites angle-bracketed destinations containing spaces and parentheses', () => {
    const input =
      '![](<../../../.gitbook/assets/Screen Shot 2020-07-27 at 9.23.55 AM (1).png>)';

    const output = rewriteMarkdownLinkDestinations(input, (destination) =>
      destination.replace('../../../.gitbook/assets/', '/gitbook-assets/'),
    );

    expect(output).toBe(
      '![](</gitbook-assets/Screen Shot 2020-07-27 at 9.23.55 AM (1).png>)',
    );
  });

  it('keeps rewritten destinations without spaces unwrapped', () => {
    const input = '[Guide](./guide.md)';
    const output = rewriteMarkdownLinkDestinations(input, () => '/guide');

    expect(output).toBe('[Guide](/guide)');
  });
});
