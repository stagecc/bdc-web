import {
  initSearchResultsControls,
  observeSearchNoResultsSuggestions,
  renderSearchResultsView,
  type SearchResultRecord,
  setSearchResultsState,
} from './enhance-search-results';

type PagefindResultData = {
  url: string;
  excerpt?: string;
  meta?: {
    title?: string;
  };
};

type PagefindSearchResult = {
  data: () => Promise<PagefindResultData>;
};

export type PagefindModule = {
  search: (term: string) => Promise<{ results: PagefindSearchResult[] }>;
  preload: (term: string) => Promise<void>;
};

type PagefindLoader = () => Promise<PagefindModule>;

let pagefindModule: PagefindModule | null = null;
let activeSearchToken = 0;

const importExternalModule = new Function(
  'specifier',
  'return import(specifier)',
) as (specifier: string) => Promise<PagefindModule>;

async function getPagefind(): Promise<PagefindModule> {
  if (!pagefindModule) {
    pagefindModule = await importExternalModule('/pagefind/pagefind.js');
  }

  return pagefindModule;
}

function getSearchElements() {
  const container = document.querySelector('#search-results');
  const form = document.querySelector('#search-results-form');
  const input = document.querySelector('#search-results-query');

  if (
    !(container instanceof HTMLElement) ||
    !(form instanceof HTMLFormElement) ||
    !(input instanceof HTMLInputElement)
  ) {
    return null;
  }

  return { container, form, input };
}

function updateQueryInUrl(query: string): void {
  const url = new URL(window.location.href);

  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }

  window.history.replaceState({}, '', url);
}

export async function loadSearchResults(
  container: HTMLElement,
  query: string,
  loadPagefind: PagefindLoader = getPagefind,
): Promise<void> {
  const trimmedQuery = query.trim();
  const searchToken = ++activeSearchToken;

  if (!trimmedQuery) {
    setSearchResultsState(container, [], '');
    renderSearchResultsView(container);
    return;
  }

  const pagefind = await loadPagefind();
  if (searchToken !== activeSearchToken) return;

  const search = await pagefind.search(trimmedQuery);
  if (searchToken !== activeSearchToken) return;

  const loadedResults = await Promise.all(
    search.results.map(async (result, index): Promise<SearchResultRecord> => {
      const data = await result.data();
      return {
        url: data.url,
        title: data.meta?.title?.trim() || 'Untitled',
        excerpt: data.excerpt ?? '',
        originalIndex: index,
      };
    }),
  );

  if (searchToken !== activeSearchToken) return;

  setSearchResultsState(container, loadedResults, trimmedQuery);
  renderSearchResultsView(container);
}

export function initSearchResults(
  loadPagefind: PagefindLoader = getPagefind,
): void {
  const elements = getSearchElements();
  if (!elements || elements.container.dataset.pagefindReady) return;

  elements.container.dataset.pagefindReady = 'true';

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') ?? '';
  elements.input.value = initialQuery;

  initSearchResultsControls(elements.container);
  observeSearchNoResultsSuggestions(elements.container);

  let debounceTimer: number | undefined;

  const scheduleSearch = (query: string) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      void loadSearchResults(elements.container, query, loadPagefind);
    }, 200);
  };

  const preload = () => {
    const query = elements.input.value.trim();
    if (!query) return;
    void loadPagefind().then((pagefind) => pagefind.preload(query));
  };

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.clearTimeout(debounceTimer);
    updateQueryInUrl(elements.input.value.trim());
    void loadSearchResults(
      elements.container,
      elements.input.value,
      loadPagefind,
    );
  });

  elements.input.addEventListener('input', () => {
    updateQueryInUrl(elements.input.value.trim());
    preload();
    scheduleSearch(elements.input.value);
  });

  if (initialQuery) {
    void loadSearchResults(elements.container, initialQuery, loadPagefind);
  } else {
    setSearchResultsState(elements.container, [], '');
    renderSearchResultsView(elements.container);
  }
}

const initSearchResultsOnPageLoad = () => initSearchResults();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchResultsOnPageLoad);
} else {
  initSearchResultsOnPageLoad();
}

document.addEventListener('astro:page-load', initSearchResultsOnPageLoad);
