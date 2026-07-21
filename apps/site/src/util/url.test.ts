import { describe, expect, it } from 'vitest';
import { isExternalUrl } from './url';

describe('isExternalUrl', () => {
  it('returns true for https URLs', () => {
    expect(isExternalUrl('https://example.gov')).toBe(true);
  });

  it('returns true for http URLs', () => {
    expect(isExternalUrl('http://example.gov')).toBe(true);
  });

  it('returns false for relative paths', () => {
    expect(isExternalUrl('/about')).toBe(false);
  });

  it('returns false for relative paths without leading slash', () => {
    expect(isExternalUrl('about')).toBe(false);
  });

  it('returns false for hash anchors', () => {
    expect(isExternalUrl('#section')).toBe(false);
  });
});
