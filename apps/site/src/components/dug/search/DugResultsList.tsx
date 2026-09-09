import IconButton from '@bdc/ui-react/button/IconButton';
import Card from '@bdc/ui-react/card/Card';
import Icon from '@bdc/ui-react/icon/Icon';
import Tag from '@bdc/ui-react/tag/Tag';
import type { FormEvent } from 'react';
import type { DugConcept } from './api';
import DugSearchBar from './DugSearchBar';

type Props = {
  inputValue: string;
  shortcutLabel: string;
  onInputChange: (nextValue: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchClear: () => void;
  countText: string;
  query: string;
  error: string | null;
  isLoading: boolean;
  results: DugConcept[];
  filteredResults: DugConcept[];
  onSelectResult: (result: DugConcept) => void;
  onToggleConcept: (concept: DugConcept) => void;
  conceptInCollection: (conceptId: string) => boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

function snipText(sentence: string, threshold: number): string {
  if (sentence.length <= threshold) {
    return sentence;
  }

  return `${sentence
    .split(' ')
    .reduce<string[]>((acc, word) => {
      if (acc.join(' ').length > threshold) {
        return acc;
      }

      return acc.concat(word);
    }, [])
    .join(' ')}...`;
}

export default function DugResultsList({
  inputValue,
  shortcutLabel,
  onInputChange,
  onSearchSubmit,
  onSearchClear,
  countText,
  query,
  error,
  isLoading,
  results,
  filteredResults,
  onSelectResult,
  onToggleConcept,
  conceptInCollection,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: Props) {
  return (
    <div className="display-flex flex-column gap-2">
      <DugSearchBar
        id="dug-search-input"
        placeholder="Search disease, phenotype, process, or anatomy"
        submitLabel="Search"
        value={inputValue}
        shortcutLabel={shortcutLabel}
        onChange={onInputChange}
        onSubmit={onSearchSubmit}
        onClear={onSearchClear}
      />

      <p className="margin-y-2 text-base">
        {countText}
        {query && (
          <button
            type="button"
            className="usa-button usa-button--unstyled font-body-xs margin-left-105"
            onClick={onSearchClear}
          >
            Clear query
          </button>
        )}
      </p>

      {error && (
        <div className="usa-alert usa-alert--error margin-top-2" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      {!error && !query && (
        <p className="font-ui-md text-italic margin-top-1">
          Try terms like: asthma, pulmonary fibrosis, anemia, or sleep apnea.
        </p>
      )}

      {!error && query && !isLoading && results.length === 0 && (
        <p className="font-ui-md text-italic margin-top-1">
          No concept results were found for this query.
        </p>
      )}

      {!error &&
        query &&
        !isLoading &&
        results.length > 0 &&
        filteredResults.length === 0 && (
          <p className="font-ui-md text-italic margin-top-1">
            No results match the selected filters.
          </p>
        )}

      {!error && filteredResults.length > 0 && (
        <div className="grid-row grid-gap-2 margin-top-1">
          {filteredResults.map((result) => (
            <Card
              as="article"
              variant="panel"
              key={result.id}
              className="height-full margin-bottom-2"
            >
              <div className="display-flex flex-column height-full">
                <div className="display-block tablet:display-flex tablet:flex-justify flex-align-start gap-1">
                  <h3 className="font-heading-md margin-y-0 flex-1 line-height-sans-2 display-flex flex-align-end">
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled text-bold text-primary-dark text-left"
                      onClick={() => onSelectResult(result)}
                    >
                      {result.name}
                    </button>
                  </h3>
                  <IconButton
                    className="margin-top-1 tablet:margin-top-0 padding-05"
                    icon="Bookmark"
                    tone={
                      conceptInCollection(result.id) ? 'secondary' : 'neutral'
                    }
                    onClick={() => onToggleConcept(result)}
                    aria-pressed={conceptInCollection(result.id)}
                    label={
                      conceptInCollection(result.id)
                        ? `Remove ${result.name} from collection`
                        : `Add ${result.name} to collection`
                    }
                    srText={
                      conceptInCollection(result.id)
                        ? 'Remove from collection'
                        : 'Add to collection'
                    }
                  />
                </div>

                <p className="margin-y-1 line-height-sans-4 font-body-sm desktop:font-body-md">
                  {snipText(
                    result.description || 'No description available.',
                    170,
                  )}
                </p>

                <div className="font-body-2xs desktop:font-body-xs text-base-dark display-flex flex-align-end flex-wrap gap-1 tablet:flex-justify margin-top-auto">
                  <span className="display-flex flex-align-center">
                    <Icon.Identification aria-hidden />
                    <code className="font-mono-2xs margin-left-05">
                      {result.id}
                    </code>
                  </span>
                  <span className="display-flex flex-align-center">
                    <Tag
                      label={result.type || 'UNKNOWN'}
                      tone="neutral"
                      className="margin-left-05"
                    />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!error && !isLoading && hasMore && (
        <div className="margin-top-3 text-center">
          <button
            type="button"
            className="usa-button usa-button--outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more results'}
          </button>
        </div>
      )}

      {!error &&
        !isLoading &&
        query &&
        !hasMore &&
        filteredResults.length > 0 && (
          <p className="text-center text-base margin-top-2">
            You have reached the end of the available results.
          </p>
        )}

      {isLoading && (
        <div className="display-flex flex-align-center flex-justify-center padding-y-6">
          <div className="usa-sr-only">Loading</div>
          <div className="usa-icon usa-icon--size-5" aria-hidden="true">
            <img src="/img/loader.svg" alt="" />
          </div>
        </div>
      )}
    </div>
  );
}
