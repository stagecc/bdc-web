import { nameToEmoji } from 'gemoji';

// See supported emoji here:
// https://github.com/wooorm/gemoji/blob/main/support.md

const SHORTCODE_PATTERN = /:([a-z0-9+-]+(?:\\?_[a-z0-9+-]+)*):/gi;
const SHORTCODE_ALIASES = {
  // Used in current GitBook content; normalize to canonical gemoji shortcode.
  blue_circle: 'large_blue_circle',
};

export function transformEmojiShortcodes(content) {
  return content.replace(SHORTCODE_PATTERN, (match, rawName) => {
    const normalizedName = rawName.replaceAll('\\_', '_').toLowerCase();
    const canonicalName = SHORTCODE_ALIASES[normalizedName] ?? normalizedName;
    const emoji = nameToEmoji[canonicalName];
    return emoji ?? match;
  });
}
