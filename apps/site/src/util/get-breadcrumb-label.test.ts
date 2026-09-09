import { describe, expect, it } from 'vitest';
import { getBreadcrumbLabel } from './get-breadcrumb-label';

describe('getBreadcrumbLabel', () => {
  it('formats a simple two-level pathname', () => {
    expect(
      getBreadcrumbLabel('/article/article-name', 'https://example.com'),
    ).toBe('Article > Article Name');
  });

  it('decodes URL segments and normalizes underscores', () => {
    expect(
      getBreadcrumbLabel(
        '/help/contact_and_support%20team',
        'https://example.com',
      ),
    ).toBe('Help > Contact And Support Team');
  });

  it('removes file extensions from segments', () => {
    expect(
      getBreadcrumbLabel('/search/index.html', 'https://example.com'),
    ).toBe('Search > Index');
  });

  it('returns an empty string for invalid URLs', () => {
    expect(getBreadcrumbLabel('::::')).toBe('');
  });
});
