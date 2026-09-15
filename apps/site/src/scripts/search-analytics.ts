const SEARCH_RESULT_LINK_SELECTOR =
  '.pf-result-link, .pagefind-ui__result-link';

export function applySearchResultAnalytics(
  container: Element,
  query: string,
  startRank = 1,
) {
  const trimmedQuery = query.trim();

  container
    .querySelectorAll(SEARCH_RESULT_LINK_SELECTOR)
    .forEach((link, index) => {
      if (!(link instanceof HTMLAnchorElement)) return;

      link.dataset.analyticsSearchRank = String(startRank + index);

      if (trimmedQuery) {
        link.dataset.analyticsSearchQuery = trimmedQuery;
        return;
      }

      delete link.dataset.analyticsSearchQuery;
    });
}
