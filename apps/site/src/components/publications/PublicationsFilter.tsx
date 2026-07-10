import { useState } from 'react';
import Tooltip from '../Tooltip.tsx';
import PublicationCard from './PublicationCard';
import {
  type Filters,
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

// NOTE: Tooltip text is hardcoded for specific Research Community values.
// If these option strings change in the data, tooltips will silently stop appearing.
// Content manager is aware — see publications filtering decision log.
const RESEARCH_COMMUNITY_TOOLTIPS: Record<string, string> = {
  'Not Applicable': 'This work was not part of a Research Community effort.',
  Other: 'This work is part of a research community not listed on the website.',
};

function FilterGroup({
  legend,
  options,
  selected,
  onToggle,
  threshold = 5,
  tooltips = {},
}: {
  legend: string;
  options: Map<string, number>;
  selected: string[];
  onToggle: (value: string) => void;
  threshold?: number;
  tooltips?: Record<string, string>;
}) {
  const [showAll, setShowAll] = useState(false);

  if (options.size === 0) return null;

  const entries = [...options.entries()];
  const selectedEntries = entries.filter(([value]) => selected.includes(value));
  const unselectedEntries = entries.filter(
    ([value]) => !selected.includes(value),
  );
  const hiddenCount = Math.max(0, unselectedEntries.length - threshold);
  const needsTruncation = hiddenCount > 0;
  const visibleEntries = showAll
    ? entries
    : [...selectedEntries, ...unselectedEntries.slice(0, threshold)];

  return (
    <fieldset className="usa-fieldset margin-bottom-3">
      <legend className="usa-legend text-bold">{legend}</legend>
      {visibleEntries.map(([value, count]) => {
        const id = `filter-${legend.toLowerCase().replace(/\s+/g, '-')}-${value.toLowerCase().replace(/\s+/g, '-')}`;
        const tooltipText = tooltips[value];
        const isDisabled = count === 0 && !selected.includes(value);

        return (
          <div key={value} className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              type="checkbox"
              id={id}
              name={`filter-${legend.toLowerCase().replace(/\s+/g, '-')}`}
              value={value}
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              disabled={isDisabled}
            />
            <label
              className={`usa-checkbox__label${isDisabled ? ' text-base-light' : ''}`}
              htmlFor={id}
              style={isDisabled ? { opacity: 0.4 } : undefined}
            >
              {value}
              {tooltipText && <Tooltip text={tooltipText} />}
              <span className="text-base-light"> ({count})</span>
            </label>
          </div>
        );
      })}
      {needsTruncation && (
        <button
          type="button"
          className="usa-button usa-button--unstyled font-body-xs margin-top-1"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}
    </fieldset>
  );
}

const ActiveChip = ({
  label,
  onRemove,
  italic = false,
}: {
  label: string;
  onRemove: () => void;
  italic?: boolean;
}) => (
  <button
    onClick={onRemove}
    type="button"
    className="usa-button usa-button--unstyled bdc-filter-chip"
    aria-label={`Remove filter: ${label}`}
  >
    <span
      className={`usa-tag bdc-tag--filter${italic ? ' bdc-tag--filter-italic' : ''}`}
    >
      {label}
      <span aria-hidden="true" className="bdc-filter-chip__remove">
        ×
      </span>
    </span>
  </button>
);

const Separator = () => (
  <span className="text-base-light bdc-active-filters__separator">|</span>
);

export default function PublicationsFilter({ publications }: Props) {
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

  const hasAnyActive = hasActiveFilters || !!search;

  const groupsAfter = (current: keyof Filters) => {
    const order: (keyof Filters)[] = [
      'year',
      'researchCommunity',
      'researchArea',
      'bdcContribution',
    ];
    const idx = order.indexOf(current);
    return order.slice(idx + 1).some((k) => filters[k].length > 0);
  };

  return (
    <div
      className="grid-row grid-gap"
      style={{ maxWidth: '1000px', margin: '0 auto' }}
    >
      {/* Left sidebar — search + filters */}
      <aside className="tablet:grid-col-4" style={{ padding: 0 }}>
        <div className="usa-card__container" style={{ overflow: 'hidden' }}>
          {/* Search header */}
          <div className="margin-bottom-2">
            <div className="bg-base-lightest padding-x-3 padding-y-105">
              <label
                className="usa-label margin-0"
                htmlFor="pub-search"
                style={{ fontWeight: 600 }}
              >
                Search
              </label>
            </div>
            <div className="padding-x-3 padding-top-1">
              <p
                className="usa-hint margin-top-05"
                style={{ fontSize: '13px' }}
              >
                Search by title, journal, or research community
              </p>
              <input
                className="usa-input usa-search__input--no-button width-full margin-top-1"
                id="pub-search"
                type="search"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search publications..."
              />
            </div>
          </div>

          {/* Filters header */}
          <div className="bg-base-lightest padding-x-3 padding-y-105 margin-top-4">
            <div className="display-flex flex-justify flex-align-center">
              <h2 className="usa-legend margin-0" style={{ fontWeight: 600 }}>
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="usa-button usa-button--unstyled"
                  onClick={clearFilters}
                  style={{ textDecoration: 'none' }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter groups */}
          <div className="padding-x-3">
            <FilterGroup
              legend="Year"
              options={filterOptions.years}
              selected={filters.year}
              onToggle={(v) => toggleFilter('year', v)}
            />
            <FilterGroup
              legend="Research Community"
              options={filterOptions.researchCommunities}
              selected={filters.researchCommunity}
              onToggle={(v) => toggleFilter('researchCommunity', v)}
              tooltips={RESEARCH_COMMUNITY_TOOLTIPS}
            />
            <FilterGroup
              legend="Research Area"
              options={filterOptions.researchAreas}
              selected={filters.researchArea}
              onToggle={(v) => toggleFilter('researchArea', v)}
            />
            <FilterGroup
              legend="BDC Contribution"
              options={filterOptions.bdcContributions}
              selected={filters.bdcContribution}
              onToggle={(v) => toggleFilter('bdcContribution', v)}
            />
          </div>
        </div>
      </aside>

      {/* Right — results */}
      <div className="tablet:grid-col-8">
        {/* Active filter chips */}
        {hasAnyActive && (
          <div className="bg-base-lightest border border-base-light radius-md padding-105 margin-bottom-2 bdc-active-filters">
            <span className="text-bold font-body-sm margin-right-1">
              Active filters:
            </span>
            {search && (
              <>
                <span
                  className="text-base font-body-xs text-bold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Search:
                </span>
                <ActiveChip
                  label={search}
                  onRemove={() => updateSearch('')}
                  italic
                />
                {hasActiveFilters && <Separator />}
              </>
            )}
            {filters.year.length > 0 && (
              <>
                <span
                  className="text-base font-body-xs text-bold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Year:
                </span>
                {filters.year.map((v) => (
                  <ActiveChip
                    key={v}
                    label={v}
                    onRemove={() => toggleFilter('year', v)}
                  />
                ))}
                {groupsAfter('year') && <Separator />}
              </>
            )}
            {filters.researchCommunity.length > 0 && (
              <>
                <span
                  className="text-base font-body-xs text-bold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Community:
                </span>
                {filters.researchCommunity.map((v) => (
                  <ActiveChip
                    key={v}
                    label={v}
                    onRemove={() => toggleFilter('researchCommunity', v)}
                  />
                ))}
                {groupsAfter('researchCommunity') && <Separator />}
              </>
            )}
            {filters.researchArea.length > 0 && (
              <>
                <span
                  className="text-base font-body-xs text-bold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Research area:
                </span>
                {filters.researchArea.map((v) => (
                  <ActiveChip
                    key={v}
                    label={v}
                    onRemove={() => toggleFilter('researchArea', v)}
                  />
                ))}
                {groupsAfter('researchArea') && <Separator />}
              </>
            )}
            {filters.bdcContribution.length > 0 && (
              <>
                <span
                  className="text-base font-body-xs text-bold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  BDC contribution:
                </span>
                {filters.bdcContribution.map((v) => (
                  <ActiveChip
                    key={v}
                    label={v}
                    onRemove={() => toggleFilter('bdcContribution', v)}
                  />
                ))}
              </>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="usa-button usa-button--unstyled text-base-dark font-body-xs bdc-active-filters__clear"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Sort + results count */}
        <div className="display-flex flex-justify flex-align-center margin-bottom-2">
          <span className="text-base">
            Showing {filtered.length} publication
            {filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="display-flex flex-align-center">
            <label
              className="usa-label display-inline margin-right-1 margin-top-0"
              htmlFor="pub-sort"
            >
              Sort by
            </label>
            <select
              className="usa-select display-inline width-auto margin-top-0"
              id="pub-sort"
              value={sort}
              onChange={(e) => updateSort(e.target.value as SortOption)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Publications list */}
        {visible.length === 0 ? (
          <div>
            <h3>No results found</h3>
            <p>No publications match your current search or filters.</p>
            <button type="button" className="usa-button" onClick={clearAll}>
              {hasActiveFilters && search
                ? 'Clear search and filters'
                : hasActiveFilters
                  ? 'Clear filters'
                  : 'Clear search'}
            </button>
          </div>
        ) : (
          <ul className="usa-collection">
            {visible.map((pub, i) => (
              <PublicationCard key={`${pub.url}-${i}`} pub={pub} />
            ))}
          </ul>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="margin-top-4 text-center">
            <button
              type="button"
              className="usa-button usa-button--outline"
              onClick={loadMore}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
