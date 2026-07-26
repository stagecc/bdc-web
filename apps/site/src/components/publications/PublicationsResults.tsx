import Button from '@bdc/ui-react/button/Button';
import PublicationCard from './PublicationCard';
import type { Publication } from './usePublications';

type Props = {
  visible: Publication[];
  hasMore: boolean;
  hasActiveFilters: boolean;
  search: string;
  clearAll: () => void;
  loadMore: () => void;
};

export default function PublicationsResults({
  visible,
  hasMore,
  hasActiveFilters,
  search,
  clearAll,
  loadMore,
}: Props) {
  return (
    <>
      {visible.length === 0 ? (
        <div>
          <h3>No results found</h3>
          <p>No publications match your current search or filters.</p>
          <Button type="button" onClick={clearAll}>
            {hasActiveFilters && search
              ? 'Clear search and filters'
              : hasActiveFilters
                ? 'Clear filters'
                : 'Clear search'}
          </Button>
        </div>
      ) : (
        <ul className="usa-list usa-list--unstyled margin-0">
          {visible.map((pub, i) => (
            <li key={`${pub.url}-${i}`}>
              <PublicationCard key={`${pub.url}-${i}`} pub={pub} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="margin-top-4 text-center">
          <Button type="button" outline onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
