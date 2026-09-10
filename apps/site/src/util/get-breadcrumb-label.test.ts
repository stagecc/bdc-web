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

  it('capitalizes BDC wherever it appears as a word', () => {
    expect(getBreadcrumbLabel('/cite-bdc', 'https://example.com')).toBe(
      'Cite BDC',
    );
    expect(getBreadcrumbLabel('/help/contact-bdc', 'https://example.com')).toBe(
      'Help > Contact BDC',
    );
    expect(
      getBreadcrumbLabel('/data/analyze/bdc-workspaces', 'https://example.com'),
    ).toBe('Data > Analyze > BDC Workspaces');
  });

  it('uses the nav label for BDC-Enabled Research, including as a parent crumb', () => {
    expect(
      getBreadcrumbLabel('/news/bdc-enabled-research', 'https://example.com'),
    ).toBe('News > BDC-Enabled Research');
    expect(
      getBreadcrumbLabel(
        '/news/bdc-enabled-research/publication-submission',
        'https://example.com',
      ),
    ).toBe('News > BDC-Enabled Research > Publication Submission');
  });

  it('uses nav labels for other known paths', () => {
    expect(getBreadcrumbLabel('/about/bdc', 'https://example.com')).toBe(
      'About > BDC',
    );
    expect(
      getBreadcrumbLabel('/about/bdc/fellows', 'https://example.com'),
    ).toBe('About > BDC > Fellows');
    expect(getBreadcrumbLabel('/help/faqs', 'https://example.com')).toBe(
      'Help > FAQs',
    );
  });
});
