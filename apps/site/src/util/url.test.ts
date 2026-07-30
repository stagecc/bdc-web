import { describe, expect, it } from 'vitest';
import {
  classifyLink,
  isExternalUrl,
  isGovHostname,
  requiresExitNotice,
} from './url';

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

  it('returns false for mailto links', () => {
    expect(isExternalUrl('mailto:help@example.com')).toBe(false);
  });
});

describe('isGovHostname', () => {
  it('returns true for gov domains and subdomains', () => {
    expect(isGovHostname('nih.gov')).toBe(true);
    expect(isGovHostname('example.nih.gov')).toBe(true);
  });

  it('returns false for deceptive hostnames', () => {
    expect(isGovHostname('nih.gov.evil.com')).toBe(false);
  });

  it('handles case and trailing dots', () => {
    expect(isGovHostname('NIH.GOV.')).toBe(true);
  });
});

describe('classifyLink', () => {
  it('returns external-gov for .gov urls', () => {
    expect(classifyLink('https://www.nih.gov')).toBe('external-gov');
  });

  it('returns external-non-gov for non-.gov urls', () => {
    expect(classifyLink('https://example.com')).toBe('external-non-gov');
  });

  it('returns internal for same-origin absolute urls', () => {
    expect(
      classifyLink('https://biodatacatalyst.nhlbi.nih.gov/help', {
        currentOrigin: 'https://biodatacatalyst.nhlbi.nih.gov',
      }),
    ).toBe('internal');
  });
});

describe('requiresExitNotice', () => {
  it('returns true for non-.gov external urls', () => {
    expect(requiresExitNotice('https://example.com')).toBe(true);
  });

  it('returns false for .gov urls', () => {
    expect(requiresExitNotice('https://www.nih.gov')).toBe(false);
  });

  it('returns false for internal urls', () => {
    expect(requiresExitNotice('/help')).toBe(false);
  });
});
