import { beforeEach, describe, expect, it, vi } from 'vitest';

const enhancementMocks = vi.hoisted(() => ({
  initSearchResultsControls: vi.fn(),
  observeSearchNoResultsSuggestions: vi.fn(),
  renderSearchResultsView: vi.fn(),
  setSearchResultsState: vi.fn(),
}));

vi.mock('./enhance-search-results', () => enhancementMocks);

import {
  initSearchResults,
  loadSearchResults,
  type PagefindModule,
} from './init-search-results';

function renderSearchElements(): HTMLElement {
  document.body.innerHTML = `
    <div id="search-results"></div>
    <form id="search-results-form">
      <input id="search-results-query" />
    </form>
  `;

  const container = document.querySelector('#search-results');
  if (!(container instanceof HTMLElement)) {
    throw new Error('Search results container is missing from the test DOM');
  }
  return container;
}

function createPagefind(): PagefindModule {
  return {
    preload: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue({ results: [] }),
  };
}

describe('search results initialization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/search');
  });

  it('guards initialization and debounces searches while syncing the URL and preloading', async () => {
    const pagefind = createPagefind();
    const loadPagefind = vi.fn().mockResolvedValue(pagefind);

    expect(() => initSearchResults(loadPagefind)).not.toThrow();
    expect(loadPagefind).not.toHaveBeenCalled();

    const container = renderSearchElements();
    initSearchResults(loadPagefind);
    initSearchResults(loadPagefind);

    expect(container).toHaveAttribute('data-pagefind-ready', 'true');
    expect(enhancementMocks.initSearchResultsControls).toHaveBeenCalledTimes(1);
    expect(
      enhancementMocks.observeSearchNoResultsSuggestions,
    ).toHaveBeenCalledTimes(1);

    const input = document.querySelector<HTMLInputElement>(
      '#search-results-query',
    );
    if (!input) throw new Error('Search input is missing from the test DOM');

    input.value = 'kidney disease';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.resolve();

    expect(window.location.search).toBe('?q=kidney+disease');
    expect(pagefind.preload).toHaveBeenCalledOnce();
    expect(pagefind.preload).toHaveBeenCalledWith('kidney disease');
    expect(pagefind.search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(199);
    expect(pagefind.search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(pagefind.search).toHaveBeenCalledOnce();
    expect(pagefind.search).toHaveBeenCalledWith('kidney disease');
  });

  it('ignores results from a stale search token', async () => {
    vi.useRealTimers();
    const container = renderSearchElements();

    let resolveFirstSearch:
      | ((value: Awaited<ReturnType<PagefindModule['search']>>) => void)
      | undefined;
    const firstSearch = new Promise<
      Awaited<ReturnType<PagefindModule['search']>>
    >((resolve) => {
      resolveFirstSearch = resolve;
    });

    const pagefind: PagefindModule = {
      preload: vi.fn().mockResolvedValue(undefined),
      search: vi.fn((term: string) => {
        if (term === 'first') return firstSearch;
        return Promise.resolve({
          results: [
            {
              data: async () => ({
                url: '/second',
                excerpt: 'Second result',
                meta: { title: 'Second' },
              }),
            },
          ],
        });
      }),
    };
    const loadPagefind = vi.fn().mockResolvedValue(pagefind);

    const staleRequest = loadSearchResults(container, 'first', loadPagefind);
    await vi.waitFor(() =>
      expect(pagefind.search).toHaveBeenCalledWith('first'),
    );

    await loadSearchResults(container, 'second', loadPagefind);
    expect(enhancementMocks.setSearchResultsState).toHaveBeenCalledOnce();
    expect(enhancementMocks.setSearchResultsState).toHaveBeenLastCalledWith(
      container,
      [
        {
          url: '/second',
          title: 'Second',
          excerpt: 'Second result',
          originalIndex: 0,
        },
      ],
      'second',
    );

    resolveFirstSearch?.({
      results: [
        {
          data: async () => ({
            url: '/first',
            meta: { title: 'First' },
          }),
        },
      ],
    });
    await staleRequest;

    expect(enhancementMocks.setSearchResultsState).toHaveBeenCalledOnce();
    expect(enhancementMocks.renderSearchResultsView).toHaveBeenCalledOnce();
  });
});
