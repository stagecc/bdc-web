import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(slugify('Heart Failure')).toBe('heart-failure');
  });

  it('extracts the acronym when parenthesized', () => {
    expect(slugify('Trans-Omics for Precision Medicine (TOPMed)')).toBe(
      'topmed',
    );
  });

  it('strips special characters', () => {
    expect(slugify('COVID-19 & Genomics!')).toBe('covid-19-genomics');
  });

  it('removes leading and trailing hyphens', () => {
    expect(slugify('--trimmed--')).toBe('trimmed');
  });

  it('handles a single word', () => {
    expect(slugify('Asthma')).toBe('asthma');
  });
});
