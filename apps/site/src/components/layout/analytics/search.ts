import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';

type SearchSubmitSurface = 'modal' | 'results_page';

type SearchSubmitParams = {
  searchTerm: string;
  searchSurface: SearchSubmitSurface;
};

type SearchResultClickParams = {
  searchTerm: string;
  resultUrl: string;
  resultTitle?: string;
  resultIndex?: number;
};

export function trackSearchSubmit({
  searchTerm,
  searchSurface,
}: SearchSubmitParams) {
  pushAnalyticsEvent({
    event: 'search_submit',
    search_term: searchTerm,
    search_surface: searchSurface,
    page_path: window.location.pathname,
  });
}

export function trackSearchResultClick({
  searchTerm,
  resultUrl,
  resultTitle,
  resultIndex,
}: SearchResultClickParams) {
  pushAnalyticsEvent({
    event: 'search_result_click',
    search_term: searchTerm,
    result_url: resultUrl,
    result_title: resultTitle,
    result_index: resultIndex,
    page_path: window.location.pathname,
  });
}
