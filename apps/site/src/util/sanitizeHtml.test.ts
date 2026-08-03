import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('preserves basic formatting and links', () => {
    const input =
      '<p>Read the <strong>guide</strong> and <a href="https://example.org/docs">docs</a>.</p><ul><li>One</li><li>Two</li></ul>';

    const output = sanitizeHtml(input);

    expect(output).toContain('<p>');
    expect(output).toContain('<strong>guide</strong>');
    expect(output).toContain('<a href="https://example.org/docs">docs</a>');
    expect(output).toContain('<ul><li>One</li><li>Two</li></ul>');
  });

  it('strips unsafe tags and event-handler attributes', () => {
    const input =
      '<p onclick="evil()">Hello<script>alert(1)</script></p><img src="x" onerror="evil()" />';

    const output = sanitizeHtml(input);

    expect(output).toBe('<p>Hello</p>');
  });

  it('strips unsafe link protocols', () => {
    const input = '<a href="javascript:alert(1)">Bad link</a>';

    const output = sanitizeHtml(input);

    expect(output).toBe('<a>Bad link</a>');
  });
});
