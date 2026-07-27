import Button from '@bdc/ui-react/button/Button';
import FocusTrap from 'focus-trap-react';
import { useEffect, useMemo, useState } from 'react';
import PublicationsActiveFilters from './PublicationsActiveFilters';
import PublicationsFilterPanel from './PublicationsFilterPanel';
import PublicationsResults from './PublicationsResults';
import PublicationsToolbar from './PublicationsToolbar';
import {
  type Publication,
  type SortOption,
  usePublications,
} from './usePublications';

type Props = {
  publications: Publication[];
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'most-recent', label: 'Most Recent' },
  { value: 'least-recent', label: 'Least Recent' },
  { value: 'title-az', label: 'Title, A–Z' },
  { value: 'title-za', label: 'Title, Z–A' },
];

export default function PublicationsExplorer({ publications }: Props) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const {
    search,
    filters,
    sort,
    filtered,
    visible,
    filterOptions,
    hasActiveFilters,
    hasMore,
    updateSearch,
    toggleFilter,
    clearFilters,
    clearAll,
    updateSort,
    loadMore,
  } = usePublications(publications);

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).reduce(
        (count, values) => count + values.length,
        0,
      ),
    [filters],
  );
  const hasAnyActive = hasActiveFilters || Boolean(search);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileDrawerOpen(false);
    };

    const handleBreakpoint = () => {
      if (window.matchMedia('(min-width: 40em)').matches) {
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleBreakpoint);
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className="grid-row grid-gap">
      <aside className="tablet:grid-col-4 margin-bottom-2 tablet:margin-bottom-0">
        <div className="tablet:display-none">
          <Button
            type="button"
            outline
            className="width-full"
            aria-haspopup="dialog"
            aria-expanded={isMobileDrawerOpen}
            aria-controls="publications-mobile-drawer"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            {`Show filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          </Button>
        </div>

        <div className="display-none tablet:display-block margin-top-2 tablet:margin-top-0">
          <PublicationsFilterPanel
            search={search}
            filters={filters}
            filterOptions={filterOptions}
            hasActiveFilters={hasActiveFilters}
            idNamespace="desktop-"
            updateSearch={updateSearch}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
          />
        </div>

        {isMobileDrawerOpen && (
          <FocusTrap>
            <div
              id="publications-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="publications-mobile-filters-title"
              className="position-fixed top-0 right-0 bottom-0 left-0 z-top display-flex flex-align-end flex-justify-center tablet:display-none"
            >
              <button
                type="button"
                className="position-absolute top-0 right-0 bottom-0 left-0 border-0 padding-0 bg-black opacity-50"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close filters"
              />

              <div className="position-relative width-full maxh-viewport bg-white overflow-auto shadow-5">
                <div className="position-sticky top-0 bg-white border-bottom border-base-lighter padding-x-2 padding-y-1">
                  <div className="display-flex flex-justify flex-align-center">
                    <h2
                      id="publications-mobile-filters-title"
                      className="font-heading-md margin-0"
                    >
                      Filter publications
                    </h2>
                    <Button
                      type="button"
                      unstyled
                      size="big"
                      className="usa-button usa-button--unstyled text-no-underline hover:text-no-underline"
                      onClick={() => setIsMobileDrawerOpen(false)}
                    >
                      &times;
                    </Button>
                  </div>
                </div>

                <div className="padding-2">
                  <PublicationsFilterPanel
                    search={search}
                    filters={filters}
                    filterOptions={filterOptions}
                    hasActiveFilters={hasActiveFilters}
                    collapsibleGroups
                    idNamespace="mobile-"
                    updateSearch={updateSearch}
                    toggleFilter={toggleFilter}
                    clearFilters={clearFilters}
                  />
                </div>

                <div className="position-sticky bottom-0 bg-white border-top border-base-lighter padding-2">
                  <Button
                    type="button"
                    className="width-full margin-bottom-1"
                    onClick={() => setIsMobileDrawerOpen(false)}
                  >
                    {`View ${filtered.length} publication${filtered.length === 1 ? '' : 's'}`}
                  </Button>
                  {hasAnyActive && (
                    <Button
                      type="button"
                      outline
                      className="width-full"
                      onClick={clearAll}
                    >
                      Clear search and filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </FocusTrap>
        )}
      </aside>

      <div className="tablet:grid-col-8">
        <PublicationsActiveFilters
          search={search}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          updateSearch={updateSearch}
          toggleFilter={toggleFilter}
          clearAll={clearAll}
        />

        <PublicationsToolbar
          visibleCount={visible.length}
          matchedCount={filtered.length}
          hasQuery={Boolean(search) || hasActiveFilters}
          sort={sort}
          sortOptions={SORT_OPTIONS}
          updateSort={updateSort}
        />

        <PublicationsResults
          visible={visible}
          hasMore={hasMore}
          hasActiveFilters={hasActiveFilters}
          search={search}
          clearAll={clearAll}
          loadMore={loadMore}
        />
      </div>
    </div>
  );
}
