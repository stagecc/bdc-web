import Button from '@bdc/ui-react/button/Button';
import RemovableTagPill from '@bdc/ui-react/tag/RemovableTagPill';
import { publicationTagGroupToneByKey } from './publicationTagGroups';
import type { Filters } from './usePublications';

type Props = {
  search: string;
  filters: Filters;
  hasActiveFilters: boolean;
  updateSearch: (term: string) => void;
  toggleFilter: (key: keyof Filters, value: string) => void;
  clearAll: () => void;
};

export default function PublicationsActiveFilters({
  search,
  filters,
  hasActiveFilters,
  updateSearch,
  toggleFilter,
  clearAll,
}: Props) {
  const hasAnyActive = hasActiveFilters || !!search;

  return (
    <div className="minh-9 bg-white border border-base-lighter radius-md padding-1 tablet:padding-105 margin-bottom-2 display-flex flex-wrap flex-align-center">
      <div className="width-full display-flex flex-justify flex-align-center margin-bottom-1">
        <span className="text-bold">Active filters</span>
        <Button
          type="button"
          unstyled
          disabled={!hasAnyActive}
          onClick={clearAll}
          className={`usa-button usa-button--unstyled font-body-xs text-no-underline margin-left-auto ${
            hasAnyActive ? 'text-base-dark' : 'text-base'
          }`}
        >
          Clear all
        </Button>
      </div>
      <div className="display-flex flex-wrap flex-align-center">
        {!hasAnyActive && (
          <span className="font-body-xs text-base-dark">No active filters</span>
        )}
        {search && (
          <RemovableTagPill
            label={search}
            tone="secondary"
            onRemove={() => updateSearch('')}
          />
        )}
        {filters.year.length > 0 &&
          filters.year.map((v) => (
            <RemovableTagPill
              key={v}
              label={v}
              tone="secondary"
              onRemove={() => toggleFilter('year', v)}
            />
          ))}
        {filters.researchCommunity.length > 0 &&
          filters.researchCommunity.map((v) => (
            <RemovableTagPill
              key={v}
              label={v}
              tone={publicationTagGroupToneByKey.researchCommunity}
              onRemove={() => toggleFilter('researchCommunity', v)}
            />
          ))}
        {filters.researchArea.length > 0 &&
          filters.researchArea.map((v) => (
            <RemovableTagPill
              key={v}
              label={v}
              tone={publicationTagGroupToneByKey.researchArea}
              onRemove={() => toggleFilter('researchArea', v)}
            />
          ))}
        {filters.bdcContribution.length > 0 &&
          filters.bdcContribution.map((v) => (
            <RemovableTagPill
              key={v}
              label={v}
              tone={publicationTagGroupToneByKey.bdcContribution}
              onRemove={() => toggleFilter('bdcContribution', v)}
            />
          ))}
      </div>
    </div>
  );
}
