import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import type { Filters } from '../../publications/usePublications';

function getPagePath() {
  return typeof window === 'undefined' ? '' : window.location.pathname;
}

export function getActiveFilterCount(filters: Filters) {
  return Object.values(filters).reduce(
    (count, values) => count + values.length,
    0,
  );
}

export function getActiveFilters(filters: Filters) {
  return Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => `${key}:${value}`),
  );
}

export function trackBdcEnabledResearchSearch(
  searchTerm: string,
  activeFilterCount: number,
  activeFilters: string[],
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_search',
    site_section: 'bdc_enabled_research',
    search_action: searchTerm ? 'applied' : 'cleared',
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}

export function trackBdcEnabledResearchFilterChange(
  filterGroup: keyof Filters,
  filterValue: string,
  filterAction: 'applied' | 'removed',
  activeFilterCount: number,
  activeFilters: string[],
  searchTerm?: string,
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_filter_change',
    site_section: 'bdc_enabled_research',
    filter_group: filterGroup,
    filter_value: filterValue,
    filter_action: filterAction,
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}

export function trackBdcEnabledResearchSortChange(
  sortOption: string,
  activeFilterCount: number,
  activeFilters: string[],
  searchTerm?: string,
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_sort_change',
    site_section: 'bdc_enabled_research',
    sort_option: sortOption,
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}

export function trackBdcEnabledResearchClearFilters(
  activeFilterCount: number,
  activeFilters: string[],
  searchTerm?: string,
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_clear_filters',
    site_section: 'bdc_enabled_research',
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}

export function trackBdcEnabledResearchClearAll(
  activeFilterCount: number,
  activeFilters: string[],
  searchTerm?: string,
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_clear_all',
    site_section: 'bdc_enabled_research',
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}

export function trackBdcEnabledResearchLoadMore(
  activeFilterCount: number,
  activeFilters: string[],
  searchTerm?: string,
) {
  pushAnalyticsEvent({
    event: 'bdc_enabled_research_load_more',
    site_section: 'bdc_enabled_research',
    search_term: searchTerm || undefined,
    active_filter_count: activeFilterCount,
    active_filters: activeFilters,
    page_path: getPagePath(),
  });
}
