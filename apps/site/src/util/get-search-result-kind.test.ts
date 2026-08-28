import { describe, expect, it } from 'vitest';
import { getSearchResultKind } from './get-search-result-kind';

describe('getSearchResultKind', () => {
  it('returns news for latest-updates paths', () => {
    expect(
      getSearchResultKind(
        '/news/latest-updates/example/',
        'https://example.com',
      ),
    ).toBe('news');
    expect(
      getSearchResultKind('/news/latest-updates', 'https://example.com'),
    ).toBe('news');
  });

  it('returns event for events paths', () => {
    expect(
      getSearchResultKind(
        '/news/events/2026/07/community-hours/',
        'https://example.com',
      ),
    ).toBe('event');
    expect(getSearchResultKind('/news/events/', 'https://example.com')).toBe(
      'event',
    );
    expect(
      getSearchResultKind('/news/events/archive', 'https://example.com'),
    ).toBe('event');
  });

  it('returns page for other paths', () => {
    expect(getSearchResultKind('/data/explore', 'https://example.com')).toBe(
      'page',
    );
    expect(
      getSearchResultKind('/news/news-coverage', 'https://example.com'),
    ).toBe('page');
  });

  it('returns page for invalid URLs', () => {
    expect(getSearchResultKind('::::')).toBe('page');
  });
});
