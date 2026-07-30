import { describe, expect, it } from 'vitest';
import { shouldRequireExitNotice } from './externalNotice';

describe('shouldRequireExitNotice', () => {
  const origin = 'https://biodatacatalyst.nhlbi.nih.gov';

  it('returns true when data-requires-exit-notice is true', () => {
    const anchor = {
      dataset: { requiresExitNotice: 'true' },
      href: 'https://www.nih.gov',
    };

    expect(shouldRequireExitNotice(anchor, origin)).toBe(true);
  });

  it('returns true for non-.gov external links without data attribute', () => {
    const anchor = {
      dataset: {},
      href: 'https://support.terra.bio/hc/en-us/sections/360007274612',
    };

    expect(shouldRequireExitNotice(anchor, origin)).toBe(true);
  });

  it('returns false for .gov links', () => {
    const anchor = {
      dataset: {},
      href: 'https://www.nih.gov',
    };

    expect(shouldRequireExitNotice(anchor, origin)).toBe(false);
  });

  it('returns false for same-origin links', () => {
    const anchor = {
      dataset: {},
      href: 'https://biodatacatalyst.nhlbi.nih.gov/help',
    };

    expect(shouldRequireExitNotice(anchor, origin)).toBe(false);
  });
});
