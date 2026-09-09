import IconButton from '@bdc/ui-react/button/IconButton';
import Icon from '@bdc/ui-react/icon/Icon';

type Props = {
  query: string;
  conceptTypes: string[];
  filtersOpen: boolean;
  activeFilters: string[];
  onToggleFiltersOpen: () => void;
  onToggleFilter: (filter: string) => void;
  onClearFilters: () => void;
};

export default function DugFiltersPanel({
  query,
  conceptTypes,
  filtersOpen,
  activeFilters,
  onToggleFiltersOpen,
  onToggleFilter,
  onClearFilters,
}: Props) {
  const hasFilters = query && conceptTypes.length > 0;

  if (!hasFilters) {
    return null;
  }

  const getFilterId = (filter: string) =>
    `dug-filter-${filter.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section
      id="dug-filters-panel"
      className="border border-base-lighter radius-lg padding-2 bg-white shadow-1 margin-bottom-2"
      aria-labelledby="dug-aside-filters-title"
    >
      <div className="display-flex flex-justify flex-align-center gap-1">
        <h2
          id="dug-aside-filters-title"
          className="font-heading-sm margin-0 display-flex flex-align-center"
        >
          <Icon.FilterList aria-hidden className="margin-right-1" />
          Result type filters
        </h2>
        <IconButton
          icon={filtersOpen ? 'ExpandLess' : 'ExpandMore'}
          tone="neutral"
          onClick={onToggleFiltersOpen}
          aria-expanded={filtersOpen}
          aria-controls="dug-filters-options"
          label={filtersOpen ? 'Hide filters' : 'Show filters'}
          srText={filtersOpen ? 'Hide filters' : 'Show filters'}
        />
      </div>

      <div id="dug-filters-options" hidden={!filtersOpen}>
        <fieldset className="usa-fieldset margin-top-1">
          <legend className="usa-sr-only">Filter results by type</legend>
          {conceptTypes.map((filter) => {
            const id = getFilterId(filter);

            return (
              <div key={filter} className="usa-checkbox margin-bottom-1">
                <input
                  id={id}
                  type="checkbox"
                  className="usa-checkbox__input"
                  checked={activeFilters.includes(filter)}
                  onChange={() => onToggleFilter(filter)}
                />
                <label htmlFor={id} className="usa-checkbox__label">
                  {filter}
                </label>
              </div>
            );
          })}
        </fieldset>

        {activeFilters.length > 0 && (
          <div className="display-flex flex-justify-end margin-top-1">
            <button
              type="button"
              className="usa-button usa-button--unstyled font-body-xs"
              onClick={onClearFilters}
              aria-label="Clear selected filters"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
