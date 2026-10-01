import { describe, expect, it } from 'vitest';
import { transformEmojiShortcodes } from './gitbook-emoji-shortcodes.mjs';

describe('transformEmojiShortcodes', () => {
  it('converts escaped GitBook shortcodes to unicode emoji', () => {
    const input =
      ':arrow\\_right: Start :white\\_check\\_mark: done :blue\\_circle: info';

    const output = transformEmojiShortcodes(input);

    expect(output).toContain('➡️');
    expect(output).toContain('✅');
    expect(output).toContain('🔵');
    expect(output).not.toContain(':arrow\\_right:');
    expect(output).not.toContain(':white\\_check\\_mark:');
    expect(output).not.toContain(':blue\\_circle:');
  });

  it('converts unescaped shortcode variants too', () => {
    const input =
      ':arrow_right: :white_check_mark: :blue_circle: :large_blue_circle:';
    const output = transformEmojiShortcodes(input);

    expect(output).toBe('➡️ ✅ 🔵 🔵');
  });

  it('supports arbitrary valid gemoji shortcodes without manual mapping', () => {
    const input = ':rocket: :woman\\_shrugging:';
    const output = transformEmojiShortcodes(input);

    expect(output).toBe('🚀 🤷‍♀️');
  });

  it('leaves unknown shortcodes unchanged', () => {
    const input = ':not_a_real_emoji_shortcode: :also\\_unknown:';
    const output = transformEmojiShortcodes(input);

    expect(output).toBe(':not_a_real_emoji_shortcode: :also\\_unknown:');
  });
});
