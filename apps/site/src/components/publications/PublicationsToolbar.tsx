import type { SortOption } from './usePublications';

type Props = {
  visibleCount: number;
  matchedCount: number;
  hasQuery: boolean;
  sort: SortOption;
  sortOptions: { value: SortOption; label: string }[];
  updateSort: (option: SortOption) => void;
};

export default function PublicationsToolbar({
  visibleCount,
  matchedCount,
  hasQuery,
  sort,
  sortOptions,
  updateSort,
}: Props) {
  const publicationLabel = hasQuery ? 'matching publications' : 'publications';
  const countText =
    matchedCount === 0
      ? `0 ${publicationLabel}`
      : visibleCount < matchedCount
        ? `Showing ${visibleCount} of ${matchedCount} ${publicationLabel}`
        : `${matchedCount} ${publicationLabel}`;

  return (
    <div className="display-block tablet:display-flex tablet:flex-justify flex-align-center">
      <span className="text-base margin-bottom-1 tablet:margin-bottom-0">
        {countText}
      </span>
      <div className="display-flex display-flex flex-justify-center flex-align-end text-no-wrap margin-bottom-2">
        <label
          className="usa-label display-inline margin-right-1"
          htmlFor="pub-sort"
        >
          Sort by
        </label>
        <select
          className="usa-select display-inline width-full tablet:width-auto margin-top-1 tablet:margin-top-0"
          id="pub-sort"
          value={sort}
          onChange={(e) => updateSort(e.target.value as SortOption)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
