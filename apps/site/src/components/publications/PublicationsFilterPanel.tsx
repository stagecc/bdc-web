import Button from '@bdc/ui-react/button/Button';
import PublicationsFilterGroup from './PublicationsFilterGroup';
import type { Filters } from './usePublications';

type FilterOptions = {
  years: Map<string, number>;
  researchCommunities: Map<string, number>;
  researchAreas: Map<string, number>;
  bdcContributions: Map<string, number>;
};

type Props = {
  search: string;
  filters: Filters;
  filterOptions: FilterOptions;
  hasActiveFilters: boolean;
  collapsibleGroups?: boolean;
  collapsibleGroups?: boolean;
  idNamespace?: string;
  updateSearch: (term: string) => void;
  toggleFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;
};

// NOTE: Tooltip text is hardcoded for specific Research Community values.
// If these option strings change in the data, tooltips will silently stop appearing.
// Content manager is aware — see publications filtering decision log.
const RESEARCH_COMMUNITY_TOOLTIPS: Record<string, string> = {
  'Not Applicable': 'This work was not part of a Research Community effort.',
  Other: 'This work is part of a research community not listed on the website.',
};

const BDC_CONTRIBUTION_TOOLTIPS: Record<string, string> = {
  'Data Deposition': 'Data Access and/or Storage',
};

export default function PublicationsFilterPanel({
  search,
  filters,
  filterOptions,
  hasActiveFilters,
  collapsibleGroups = false,
  idNamespace = '',
  updateSearch,
  toggleFilter,
  clearFilters,
}: Props) {
  const searchInputId = `${idNamespace}pub-search`;

  return (
    <div className="border border-base-lighter radius-sm bg-white">
      <div className="bg-base-lightest padding-x-3 padding-y-1 border-bottom border-base-lighter padding-top-2 margin-bottom-0">
        <label className="usa-label margin-0 text-bold" htmlFor={searchInputId}>
          Search
        </label>
      </div>
      <div className="clearfix padding-x-3">
        <p className="usa-hint font-body-xs">
          Search by title, journal, or research community
        </p>
        <input
          className="usa-input usa-search__input--no-button width-full"
          id={searchInputId}
          type="search"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search publications..."
        />
      </div>

      <div className="bg-base-lightest padding-x-3 padding-y-1 border-bottom border-base-lighter padding-top-2 margin-bottom-0 margin-top-2">
        <div className="display-flex flex-justify flex-align-center">
          <h2 className="usa-legend margin-0 text-bold">Filters</h2>
          {hasActiveFilters && (
            <Button
              type="button"
              unstyled
              className="usa-button usa-button--unstyled font-body-xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="">
        <PublicationsFilterGroup
          legend="Year"
          options={filterOptions.years}
          selected={filters.year}
          collapsible={collapsibleGroups}
          idNamespace={idNamespace}
          onToggle={(v) => toggleFilter('year', v)}
        />
        <PublicationsFilterGroup
          legend="Research Community"
          options={filterOptions.researchCommunities}
          selected={filters.researchCommunity}
          collapsible={collapsibleGroups}
          idNamespace={idNamespace}
          onToggle={(v) => toggleFilter('researchCommunity', v)}
          tooltips={RESEARCH_COMMUNITY_TOOLTIPS}
        />
        <PublicationsFilterGroup
          legend="Research Area"
          options={filterOptions.researchAreas}
          selected={filters.researchArea}
          collapsible={collapsibleGroups}
          idNamespace={idNamespace}
          onToggle={(v) => toggleFilter('researchArea', v)}
        />
        <PublicationsFilterGroup
          legend="BDC Contribution"
          options={filterOptions.bdcContributions}
          selected={filters.bdcContribution}
          collapsible={collapsibleGroups}
          idNamespace={idNamespace}
          onToggle={(v) => toggleFilter('bdcContribution', v)}
          tooltips={BDC_CONTRIBUTION_TOOLTIPS}
        />
      </div>
    </div>
  );
}
