import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';

const SEARCH_LOCATION_SELECTOR = '[data-analytics-search-location]';
const SEARCH_SUBMIT_EVENT_SELECTOR = '[data-analytics-search-submit-event]';
const SEARCH_RESULT_EVENT_SELECTOR = '[data-analytics-search-result-event]';
const SEARCH_RESULT_LINK_SELECTOR =
  '.pf-result-link, .pagefind-ui__result-link';

function getConfiguredSearchEvent(
  element: Element,
  selector: string,
  datasetKey: 'analyticsSearchSubmitEvent' | 'analyticsSearchResultEvent',
) {
  const eventName = element.closest<HTMLElement>(selector)?.dataset[datasetKey];

  return typeof eventName === 'string' && eventName.length > 0
    ? eventName
    : null;
}

function getSearchLocation(element: Element) {
  const location = element.closest<HTMLElement>(SEARCH_LOCATION_SELECTOR)
    ?.dataset.analyticsSearchLocation;

  return typeof location === 'string' && location.length > 0 ? location : null;
}

function getSearchResultRank(element: HTMLAnchorElement) {
  const rank = Number.parseInt(element.dataset.analyticsSearchRank ?? '', 10);
  return Number.isFinite(rank) ? rank : undefined;
}

function getSearchQuery(target: Element, submitContainer: HTMLElement) {
  if (target instanceof HTMLInputElement) {
    return target.value.trim();
  }

  if (submitContainer instanceof HTMLFormElement) {
    const query = new FormData(submitContainer).get('q');
    return typeof query === 'string' ? query.trim() : '';
  }

  const input = submitContainer.querySelector('input');
  return input instanceof HTMLInputElement ? input.value.trim() : '';
}

export function trackSearchSubmitInteraction(target: Element) {
  const submitContainer = target.closest<HTMLElement>(SEARCH_SUBMIT_EVENT_SELECTOR);
  if (!submitContainer) return false;

  const eventName = getConfiguredSearchEvent(
    target,
    SEARCH_SUBMIT_EVENT_SELECTOR,
    'analyticsSearchSubmitEvent',
  );
  if (!eventName) return false;

  const query = getSearchQuery(target, submitContainer);
  if (!query) return false;

  pushAnalyticsEvent({
    event: eventName,
    site_section: 'site_search',
    search_location: getSearchLocation(target) ?? undefined,
    search_term: query,
    page_path: window.location.pathname,
  });

  return true;
}

export function trackSearchResultInteraction(target: Element) {
  const link = target.closest(SEARCH_RESULT_LINK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) return false;

  const eventName = getConfiguredSearchEvent(
    link,
    SEARCH_RESULT_EVENT_SELECTOR,
    'analyticsSearchResultEvent',
  );
  if (!eventName) return false;

  pushAnalyticsEvent({
    event: eventName,
    site_section: 'site_search',
    search_location: getSearchLocation(link) ?? undefined,
    search_term: link.dataset.analyticsSearchQuery,
    search_result_rank: getSearchResultRank(link),
    search_result_title:
      link.textContent?.replace(/\s+/g, ' ').trim() || undefined,
    search_result_url: link.href,
    page_path: window.location.pathname,
  });

  return true;
}
