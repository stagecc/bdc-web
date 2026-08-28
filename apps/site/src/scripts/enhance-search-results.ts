import { getBreadcrumbLabel } from '../util/get-breadcrumb-label';
import {
  getSearchResultKind,
  type SearchResultKind,
} from '../util/get-search-result-kind';

const SEARCH_RESULTS_LAYOUT_SELECTOR = '#search-results-layout';
const SEARCH_RESULTS_FILTERS_SELECTOR = '#search-results-filters';
const SEARCH_RESULTS_TOOLBAR_SELECTOR = '#search-results-toolbar';
const SEARCH_RESULTS_LIST_SELECTOR = '#search-results-list';
const SEARCH_RESULTS_PAGINATION_SELECTOR = '#search-results-pagination';
const SEARCH_RESULTS_MESSAGE_SELECTOR = '#search-results-message';
const RESULT_SELECTOR = '.pf-result, .pagefind-ui__result';
const LINK_SELECTOR = '.pf-result-link, .pagefind-ui__result-link';
const SEARCH_NO_RESULTS_HELPER_SELECTOR = '#search-no-results-suggestions';
const SEARCH_FILTERED_EMPTY_SELECTOR = '#search-filtered-empty';
const SEARCH_KIND_PARAM = 'kind';
const SEARCH_SORT_PARAM = 'sort';
const SEARCH_PAGE_SIZE = 10;

type SearchKindFilter = Exclude<SearchResultKind, 'page'>;

const SEARCH_KIND_FILTERS: ReadonlyArray<{
  kind: SearchKindFilter;
  id: string;
  label: string;
}> = [
  {
    kind: 'news',
    id: 'search-filter-latest-updates',
    label: 'Show latest updates',
  },
  {
    kind: 'event',
    id: 'search-filter-events',
    label: 'Show events',
  },
];

type SortOption = 'relevance' | 'title-asc' | 'title-desc' | 'section-asc';

export type SearchResultRecord = {
  url: string;
  title: string;
  excerpt: string;
  originalIndex: number;
};

type ProcessedSearchResult = SearchResultRecord & {
  breadcrumb: string;
  section: string;
  kind: SearchResultKind;
};

type SearchResultsState = {
  allResults: SearchResultRecord[];
  query: string;
  page: number;
};

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Best match',
  'title-asc': 'Title (A-Z)',
  'title-desc': 'Title (Z-A)',
  'section-asc': 'Section (A-Z)',
};

const searchStateStore = new WeakMap<HTMLElement, SearchResultsState>();

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getFiltersElement(): HTMLElement | null {
  const filters = document.querySelector(SEARCH_RESULTS_FILTERS_SELECTOR);
  return filters instanceof HTMLElement ? filters : null;
}

function getToolbarElement(): HTMLElement | null {
  const toolbar = document.querySelector(SEARCH_RESULTS_TOOLBAR_SELECTOR);
  return toolbar instanceof HTMLElement ? toolbar : null;
}

function getLayoutElement(): HTMLElement | null {
  const layout = document.querySelector(SEARCH_RESULTS_LAYOUT_SELECTOR);
  return layout instanceof HTMLElement ? layout : null;
}

function getResultsListElement(container: Element): HTMLOListElement | null {
  const list = container.querySelector(SEARCH_RESULTS_LIST_SELECTOR);
  return list instanceof HTMLOListElement ? list : null;
}

function getPaginationElement(): HTMLElement | null {
  const pagination = document.querySelector(SEARCH_RESULTS_PAGINATION_SELECTOR);
  return pagination instanceof HTMLElement ? pagination : null;
}

function getMessageElement(container: Element): HTMLElement | null {
  const message = container.querySelector(SEARCH_RESULTS_MESSAGE_SELECTOR);
  return message instanceof HTMLElement ? message : null;
}

function getFilteredEmptyElement(): HTMLElement | null {
  const filteredEmpty = document.querySelector(SEARCH_FILTERED_EMPTY_SELECTOR);
  return filteredEmpty instanceof HTMLElement ? filteredEmpty : null;
}

function parseSortOption(value: string | null): SortOption {
  if (
    value === 'relevance' ||
    value === 'title-asc' ||
    value === 'title-desc' ||
    value === 'section-asc'
  ) {
    return value;
  }

  return 'relevance';
}

function isSearchKindFilter(value: string): value is SearchKindFilter {
  return value === 'news' || value === 'event';
}

function parseSelectedKinds(values: Iterable<string>): Set<SearchKindFilter> {
  return new Set(Array.from(values).filter(isSearchKindFilter));
}

function getSearchStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    selectedKinds: parseSelectedKinds(params.getAll(SEARCH_KIND_PARAM)),
    sort: parseSortOption(params.get(SEARCH_SORT_PARAM)),
  };
}

function updateSearchStateInUrl(
  selectedKinds: Set<SearchKindFilter>,
  sort: SortOption,
): void {
  const url = new URL(window.location.href);

  url.searchParams.delete(SEARCH_KIND_PARAM);
  selectedKinds.forEach((kind) => {
    url.searchParams.append(SEARCH_KIND_PARAM, kind);
  });

  if (sort === 'relevance') {
    url.searchParams.delete(SEARCH_SORT_PARAM);
  } else {
    url.searchParams.set(SEARCH_SORT_PARAM, sort);
  }

  window.history.replaceState({}, '', url);
}

function processSearchResult(
  record: SearchResultRecord,
): ProcessedSearchResult {
  const breadcrumb = getBreadcrumbLabel(record.url, window.location.origin);
  const section = breadcrumb.split(' > ')[0]?.trim() ?? '';

  return {
    ...record,
    breadcrumb,
    section,
    kind: getSearchResultKind(record.url, window.location.origin),
  };
}

function sortSearchResults(
  results: ProcessedSearchResult[],
  sort: SortOption,
): ProcessedSearchResult[] {
  const sorted = [...results];

  const compareText = (a: string, b: string) => a.localeCompare(b, undefined);

  sorted.sort((left, right) => {
    switch (sort) {
      case 'title-asc':
        return (
          compareText(left.title, right.title) ||
          left.originalIndex - right.originalIndex
        );
      case 'title-desc':
        return (
          compareText(right.title, left.title) ||
          left.originalIndex - right.originalIndex
        );
      case 'section-asc':
        return (
          compareText(left.section || 'Other', right.section || 'Other') ||
          compareText(left.title, right.title) ||
          left.originalIndex - right.originalIndex
        );
      default:
        return left.originalIndex - right.originalIndex;
    }
  });

  return sorted;
}

function matchesKindFilter(
  result: ProcessedSearchResult,
  selectedKinds: Set<SearchKindFilter>,
): boolean {
  if (selectedKinds.size === 0) return true;
  return isSearchKindFilter(result.kind) && selectedKinds.has(result.kind);
}

function renderSearchFilters(
  filters: HTMLElement,
  selectedKinds: Set<SearchKindFilter>,
): void {
  const checkboxMarkup = SEARCH_KIND_FILTERS.map(({ kind, id, label }) => {
    return `
      <div class="usa-checkbox">
        <input
          class="usa-checkbox__input"
          id="${id}"
          name="search-filter-kind"
          type="checkbox"
          value="${kind}"
          ${selectedKinds.has(kind) ? 'checked' : ''}
        />
        <label class="usa-checkbox__label font-ui-xs" for="${id}">
          ${label}
        </label>
      </div>
    `;
  }).join('');

  filters.innerHTML = `
    <fieldset class="usa-fieldset margin-0 padding-0 border-0">
      <legend class="usa-sr-only">Filter results</legend>
      <div class="search-results-filters__toggles">
        ${checkboxMarkup}
        <button
          type="button"
          class="usa-button usa-button--unstyled font-body-xs"
          data-clear-search-filters
          ${selectedKinds.size === 0 ? 'disabled' : ''}
        >
          Clear filter
        </button>
      </div>
    </fieldset>
  `;

  filters.hidden = false;
}

function renderSearchToolbar(
  toolbar: HTMLElement,
  totalCount: number,
  visibleCount: number,
  sort: SortOption,
): void {
  const countText =
    totalCount === 0
      ? '0 matching results'
      : visibleCount < totalCount
        ? `Showing ${visibleCount} of ${totalCount} matching results`
        : `${totalCount} matching result${totalCount === 1 ? '' : 's'}`;

  toolbar.innerHTML = `
    <div class="search-results-toolbar__bar display-block tablet:display-flex tablet:flex-justify flex-align-center padding-x-3 padding-y-2 bg-base-lightest border border-base-lighter radius-sm margin-bottom-3">
      <span class="text-base margin-bottom-1 tablet:margin-bottom-0">
        ${countText}
      </span>
      <div class="display-flex flex-justify-center flex-align-end text-no-wrap">
        <label
          class="usa-label display-inline margin-right-1 margin-top-0"
          for="search-results-sort"
        >
          Sort by
        </label>
        <select
          class="usa-select display-inline width-full tablet:width-auto margin-top-0"
          id="search-results-sort"
        >
          ${Object.entries(SORT_LABELS)
            .map(
              ([value, label]) => `
                <option value="${value}" ${sort === value ? 'selected' : ''}>
                  ${label}
                </option>
              `,
            )
            .join('')}
        </select>
      </div>
    </div>
  `;

  toolbar.hidden = false;
}

function renderSearchPagination(
  pagination: HTMLElement,
  page: number,
  totalPages: number,
): void {
  if (totalPages <= 1) {
    pagination.hidden = true;
    pagination.innerHTML = '';
    return;
  }

  pagination.innerHTML = `
    <ul class="usa-button-group">
      <li class="usa-button-group__item">
        <button
          type="button"
          class="usa-button usa-button--outline"
          data-search-page="prev"
          ${page <= 1 ? 'disabled' : ''}
        >
          Previous
        </button>
      </li>
      <li class="usa-button-group__item search-results-pagination__status">
        <span class="text-base">Page ${page} of ${totalPages}</span>
      </li>
      <li class="usa-button-group__item">
        <button
          type="button"
          class="usa-button usa-button--outline"
          data-search-page="next"
          ${page >= totalPages ? 'disabled' : ''}
        >
          Next
        </button>
      </li>
    </ul>
  `;
  pagination.hidden = false;
}

function createResultElement(record: ProcessedSearchResult): HTMLElement {
  const result = document.createElement('li');
  result.className = 'pagefind-ui__result';

  const excerptMarkup = record.excerpt
    ? `<p class="pagefind-ui__result-excerpt">${record.excerpt}</p>`
    : '';

  result.innerHTML = `
    <div class="pagefind-ui__result-inner">
      <p class="pagefind-ui__result-title">
        <a class="pagefind-ui__result-link usa-link text-primary" href="${escapeHtml(record.url)}">${escapeHtml(record.title)}</a>
      </p>
      <div data-search-result-breadcrumb-slot></div>
      <p class="margin-0" data-search-result-badge-slot></p>
      ${excerptMarkup}
    </div>
  `;

  enhanceSearchResult(result);
  return result;
}

function renderResultsList(
  list: HTMLOListElement,
  pageResults: ProcessedSearchResult[],
): void {
  list.replaceChildren();
  pageResults.forEach((record) => {
    list.appendChild(createResultElement(record));
  });
}

function renderSearchMessage(
  message: HTMLElement,
  query: string,
  unfilteredCount: number,
): void {
  if (query && unfilteredCount === 0) {
    message.textContent = `No results found for "${query}"`;
    return;
  }

  message.textContent = '';
}

function syncFilteredEmptyAlert(
  unfilteredCount: number,
  filteredCount: number,
): void {
  const filteredEmpty = getFilteredEmptyElement();
  if (!filteredEmpty) return;

  filteredEmpty.hidden = !(unfilteredCount > 0 && filteredCount === 0);
}

function getSearchControlsState(container: HTMLElement) {
  if (!container.dataset.searchControlsStateReady) {
    const state = getSearchStateFromUrl();
    container.dataset.searchKinds = JSON.stringify(
      Array.from(state.selectedKinds),
    );
    container.dataset.searchSort = state.sort;
    container.dataset.searchControlsStateReady = 'true';
  }

  const selectedKinds = parseSelectedKinds(
    JSON.parse(container.dataset.searchKinds ?? '[]') as string[],
  );

  return {
    selectedKinds,
    sort: parseSortOption(container.dataset.searchSort ?? null),
  };
}

function getSearchResultsState(container: HTMLElement): SearchResultsState {
  return (
    searchStateStore.get(container) ?? {
      allResults: [],
      query: '',
      page: 1,
    }
  );
}

export function setSearchResultsState(
  container: HTMLElement,
  allResults: SearchResultRecord[],
  query: string,
): void {
  searchStateStore.set(container, {
    allResults,
    query,
    page: 1,
  });
}

function setSearchResultsPage(container: HTMLElement, page: number): void {
  const state = getSearchResultsState(container);
  searchStateStore.set(container, {
    ...state,
    page,
  });
}

export function renderSearchResultsView(container: HTMLElement): void {
  const filters = getFiltersElement();
  const toolbar = getToolbarElement();
  const layout = getLayoutElement();
  const list = getResultsListElement(container);
  const pagination = getPaginationElement();
  const message = getMessageElement(container);

  if (!filters || !toolbar || !layout || !list || !pagination || !message) {
    return;
  }

  const { allResults, query, page } = getSearchResultsState(container);
  const processedResults = allResults.map(processSearchResult);
  const { selectedKinds, sort } = getSearchControlsState(container);

  const filteredResults = processedResults.filter((result) =>
    matchesKindFilter(result, selectedKinds),
  );
  const sortedResults = sortSearchResults(filteredResults, sort);
  const totalPages = Math.max(
    1,
    Math.ceil(sortedResults.length / SEARCH_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (currentPage - 1) * SEARCH_PAGE_SIZE;
  const pageResults = sortedResults.slice(
    pageStart,
    pageStart + SEARCH_PAGE_SIZE,
  );

  if (currentPage !== page) {
    setSearchResultsPage(container, currentPage);
  }

  renderResultsList(list, pageResults);
  renderSearchMessage(message, query, allResults.length);
  syncFilteredEmptyAlert(allResults.length, sortedResults.length);
  syncSearchNoResultsSuggestions(container, query, allResults.length);

  if (allResults.length === 0) {
    filters.hidden = true;
    toolbar.hidden = true;
    pagination.hidden = true;
    updateSearchStateInUrl(selectedKinds, sort);
    return;
  }

  renderSearchFilters(filters, selectedKinds);
  renderSearchToolbar(toolbar, allResults.length, sortedResults.length, sort);
  renderSearchPagination(pagination, currentPage, totalPages);
  updateSearchStateInUrl(selectedKinds, sort);
}

export function initSearchResultsControls(container: HTMLElement): void {
  const layout = getLayoutElement();
  if (!layout || layout.dataset.searchControlsBound) return;

  layout.dataset.searchControlsBound = 'true';

  layout.addEventListener('change', (event) => {
    const target = event.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    if (target.id === 'search-results-sort') {
      container.dataset.searchSort = parseSortOption(target.value);
      setSearchResultsPage(container, 1);
      renderSearchResultsView(container);
      return;
    }

    if (target.matches('.usa-checkbox__input')) {
      const selectedKinds = parseSelectedKinds(
        Array.from(
          layout.querySelectorAll<HTMLInputElement>(
            '.usa-checkbox__input:checked',
          ),
        ).map((input) => input.value),
      );
      container.dataset.searchKinds = JSON.stringify(Array.from(selectedKinds));
      setSearchResultsPage(container, 1);
      renderSearchResultsView(container);
    }
  });

  layout.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-clear-search-filters]')) {
      container.dataset.searchKinds = '[]';
      setSearchResultsPage(container, 1);
      renderSearchResultsView(container);
      return;
    }

    if (target.matches('[data-search-page="prev"]')) {
      const state = getSearchResultsState(container);
      setSearchResultsPage(container, Math.max(1, state.page - 1));
      renderSearchResultsView(container);
      return;
    }

    if (target.matches('[data-search-page="next"]')) {
      const state = getSearchResultsState(container);
      setSearchResultsPage(container, state.page + 1);
      renderSearchResultsView(container);
    }
  });
}

function cloneTemplateElement(templateId: string): HTMLElement | null {
  const template = document.querySelector(`#${templateId}`);
  if (!(template instanceof HTMLTemplateElement)) return null;

  const element = template.content.firstElementChild?.cloneNode(true);
  return element instanceof HTMLElement ? element : null;
}

export function enhanceSearchResult(result: Element): void {
  const link = result.querySelector(LINK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) return;

  if (link.classList.contains('pagefind-ui__result-link')) {
    link.classList.add('usa-link', 'text-primary');
  }

  let breadcrumbSlot = result.querySelector(
    '[data-search-result-breadcrumb-slot]',
  );
  if (!breadcrumbSlot && result.classList.contains('pagefind-ui__result')) {
    breadcrumbSlot = document.createElement('div');
    breadcrumbSlot.setAttribute('data-search-result-breadcrumb-slot', '');

    const title = link.closest('.pagefind-ui__result-title');
    if (title?.parentNode) {
      title.parentNode.insertBefore(breadcrumbSlot, title.nextSibling);
    } else {
      result.appendChild(breadcrumbSlot);
    }
  }

  if (breadcrumbSlot && !breadcrumbSlot.hasChildNodes()) {
    const breadcrumb = cloneTemplateElement(
      'search-result-breadcrumb-template',
    );
    const label = getBreadcrumbLabel(link.href, window.location.origin);
    if (breadcrumb && label) {
      breadcrumb.textContent = label;
      breadcrumbSlot.appendChild(breadcrumb);
    }
  }

  const badgeSlot = result.querySelector('[data-search-result-badge-slot]');
  if (badgeSlot && !badgeSlot.hasChildNodes()) {
    const kind = getSearchResultKind(link.href, window.location.origin);
    const badge = cloneTemplateElement(`search-result-badge-${kind}-template`);
    if (badge) {
      badgeSlot.appendChild(badge);
    }
  }
}

export function enhanceSearchResults(container: Element): void {
  container.querySelectorAll(RESULT_SELECTOR).forEach(enhanceSearchResult);
}

export function syncSearchNoResultsSuggestions(
  container: Element,
  query?: string,
  resultCount?: number,
): void {
  const helper = document.querySelector(SEARCH_NO_RESULTS_HELPER_SELECTOR);
  if (!(helper instanceof HTMLElement)) return;

  const message = container.querySelector(SEARCH_RESULTS_MESSAGE_SELECTOR);
  const messageText = message?.textContent?.toLowerCase() ?? '';
  const hasUnfilteredResults =
    typeof resultCount === 'number'
      ? resultCount > 0
      : container.querySelector(RESULT_SELECTOR) !== null;
  const hasQueryNoResultsMessage =
    messageText.includes('no results found for') ||
    (typeof query === 'string' && query.length > 0 && resultCount === 0);

  helper.hidden = !(hasQueryNoResultsMessage && !hasUnfilteredResults);
}

export function observeSearchNoResultsSuggestions(
  container: HTMLElement,
): void {
  if (container.dataset.searchNoResultsReady) return;

  container.dataset.searchNoResultsReady = 'true';
  const observer = new MutationObserver(() => {
    syncSearchNoResultsSuggestions(container);
  });
  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  syncSearchNoResultsSuggestions(container);
}

export function observeSearchResults(container: HTMLElement): void {
  if (container.dataset.searchEnhancementsReady) return;

  container.dataset.searchEnhancementsReady = 'true';
  const observer = new MutationObserver(() => {
    enhanceSearchResults(container);
  });
  observer.observe(container, { childList: true, subtree: true });
  enhanceSearchResults(container);
}
