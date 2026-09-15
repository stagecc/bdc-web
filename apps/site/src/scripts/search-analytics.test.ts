import { describe, expect, it } from 'vitest';
import { applySearchResultAnalytics } from './search-analytics';

describe('search analytics helpers', () => {
  it('annotates configured search result links with rank and query metadata', () => {
    document.body.innerHTML = `
      <div data-analytics-search-location="modal">
        <div data-analytics-search-result-event="site_search_result_click">
          <a class="pf-result-link" href="/data/explore">Explore data</a>
        </div>
      </div>
    `;

    const wrapper = document.body;
    applySearchResultAnalytics(wrapper, 'asthma');

    const link = document.querySelector('.pf-result-link');
    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error('Expected result link to exist');
    }

    expect(link.dataset.analyticsSearchRank).toBe('1');
    expect(link.dataset.analyticsSearchQuery).toBe('asthma');
  });
});
