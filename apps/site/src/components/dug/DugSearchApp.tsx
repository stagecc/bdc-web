import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Card from '@bdc/ui-react/card/Card';
import Icon from '@bdc/ui-react/icon/Icon';
import TagPill from '@bdc/ui-react/tag/TagPill';
import {
  trackDugCheckoutCollection,
  trackDugDownloadCollection,
  trackDugSearch,
} from './analytics';
import { fetchConcepts, fetchStudies } from './api';
import type { DugConcept, DugStudy } from './api';
import styles from './DugSearchApp.module.scss';
import DugSearchBar from './DugSearchBar';
import { useQueryParam } from './useQueryParam';

const PER_PAGE = 30;
const COLLECTION_KEY = 'dug-collection';

type DugCollectionConcept = {
  id: string;
  name: string;
  description: string;
  type: string;
};

type DugCollectionStudy = {
  id: string;
  name: string;
  url: string;
  source: string;
};

type DugCollectionVariable = {
  id: string;
  name: string;
  description: string;
  url: string;
};

type DugCollection = {
  concepts: DugCollectionConcept[];
  studies: DugCollectionStudy[];
  variables: DugCollectionVariable[];
};

const EMPTY_COLLECTION: DugCollection = {
  concepts: [],
  studies: [],
  variables: [],
};

function snipText(sentence: string, threshold: number): string {
  if (sentence.length <= threshold) {
    return sentence;
  }

  return (
    sentence
      .split(' ')
      .reduce<string[]>((acc, word) => {
        if (acc.join(' ').length > threshold) {
          return acc;
        }

        return acc.concat(word);
      }, [])
      .join(' ') + '...'
  );
}

function loadCollection(): DugCollection {
  try {
    const item = window.localStorage.getItem(COLLECTION_KEY);
    if (!item) {
      return EMPTY_COLLECTION;
    }

    const parsed = JSON.parse(item) as Partial<DugCollection>;
    return {
      concepts: parsed.concepts ?? [],
      studies: parsed.studies ?? [],
      variables: parsed.variables ?? [],
    };
  } catch {
    return EMPTY_COLLECTION;
  }
}

export default function DugSearchApp() {
  const [query, setQuery] = useQueryParam('q');
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState<DugConcept[]>([]);
  const [conceptTypes, setConceptTypes] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState<DugConcept | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'studies' | 'explanation'>(
    'studies',
  );
  const [studies, setStudies] = useState<DugStudy[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(false);
  const [studiesError, setStudiesError] = useState<string | null>(null);
  const [collection, setCollection] = useState<DugCollection>(EMPTY_COLLECTION);
  const [hasLoadedCollection, setHasLoadedCollection] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const shortcutLabel = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return 'Ctrl K';
    }

    const platform = navigator.platform.toLowerCase();
    return platform.includes('mac') ? 'Cmd K' : 'Ctrl K';
  }, []);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    setCollection(loadCollection());
    setHasLoadedCollection(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCollection) {
      return;
    }

    window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  }, [collection, hasLoadedCollection]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      setCurrentPage(1);
      setTotalItems(0);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setConceptTypes([]);
    setActiveFilters([]);

    fetchConcepts(query, 1, PER_PAGE, controller.signal)
      .then((data) => {
        setResults(data.hits);
        setTotalItems(data.totalItems);
        setConceptTypes([...data.conceptTypes].sort((a, b) => a.localeCompare(b)));
      })
      .catch((nextError: unknown) => {
        if ((nextError as Error).name === 'AbortError') {
          return;
        }

        setResults([]);
        setTotalItems(0);
        setError('Dug semantic search is currently unavailable.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    const controller = new AbortController();

    setActiveDetailTab('studies');
    setStudies([]);
    setStudiesError(null);
    setStudiesLoading(true);

    fetchStudies(selectedResult.id, query, controller.signal)
      .then((data) => setStudies(data))
      .catch((nextError: unknown) => {
        if ((nextError as Error).name === 'AbortError') {
          return;
        }

        setStudiesError('Unable to load related studies.');
      })
      .finally(() => setStudiesLoading(false));

    return () => controller.abort();
  }, [query, selectedResult]);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedResult(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedResult]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement
        && (
          target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable
        )
      ) {
        return;
      }

      event.preventDefault();
      const searchInput = document.getElementById('dug-search-input');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.focus();
        searchInput.select();
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (!selectedResult) {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = document.activeElement;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleTabTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalPanelRef.current) {
        return;
      }

      const focusable = Array.from(
        modalPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    document.addEventListener('keydown', handleTabTrap);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleTabTrap);
      document.body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus();
    };
  }, [selectedResult]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    if (!window.matchMedia('(max-width: 63.99em)').matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen]);

  const filteredResults = useMemo(() => {
    if (activeFilters.length === 0) {
      return results;
    }

    return results.filter((result) => activeFilters.includes(result.type));
  }, [activeFilters, results]);

  const pageCount = useMemo(() => Math.ceil(totalItems / PER_PAGE), [totalItems]);

  const hasMore = useMemo(
    () => Boolean(query) && currentPage < pageCount,
    [currentPage, pageCount, query],
  );

  const collectionCount = useMemo(
    () =>
      collection.concepts.length +
      collection.studies.length +
      collection.variables.length,
    [collection],
  );

  const countText = useMemo(() => {
    if (!query) {
      return 'Search concepts, studies, and variables in BDC.';
    }

    if (isLoading) {
      return `Searching for "${query}"...`;
    }

    if (activeFilters.length === 0) {
      return `${totalItems.toLocaleString()} matching concept result${
        totalItems === 1 ? '' : 's'
      }`;
    }

    return filteredResults.length < totalItems
      ? `Showing ${filteredResults.length.toLocaleString()} of ${totalItems.toLocaleString()} matching concept results`
      : `${filteredResults.length.toLocaleString()} matching concept results`;
  }, [activeFilters.length, filteredResults.length, isLoading, query, totalItems]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchLocation =
      window.location.pathname === '/'
        ? 'BDC Home'
        : window.location.pathname.includes('/data/explore/dug')
          ? 'Dug Search Page'
          : window.location.pathname;

    trackDugSearch(inputValue.trim(), searchLocation);

    setQuery(inputValue);
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((previous) =>
      previous.includes(filter)
        ? previous.filter((item) => item !== filter)
        : previous.concat(filter),
    );
  };

  const clearFilters = () => setActiveFilters([]);

  const conceptInCollection = (conceptId: string) =>
    collection.concepts.some((concept) => concept.id === conceptId);

  const studyInCollection = (studyId: string) =>
    collection.studies.some((study) => study.id === studyId);

  const variableInCollection = (variableId: string) =>
    collection.variables.some((variable) => variable.id === variableId);

  const toggleConcept = (concept: DugConcept) => {
    setCollection((previous) => {
      if (previous.concepts.some((item) => item.id === concept.id)) {
        return {
          ...previous,
          concepts: previous.concepts.filter((item) => item.id !== concept.id),
        };
      }

      return {
        ...previous,
        concepts: previous.concepts.concat({
          id: concept.id,
          name: concept.name,
          description: concept.description,
          type: concept.type,
        }),
      };
    });
  };

  const toggleStudy = (study: DugStudy) => {
    setCollection((previous) => {
      if (previous.studies.some((item) => item.id === study.c_id)) {
        return {
          ...previous,
          studies: previous.studies.filter((item) => item.id !== study.c_id),
        };
      }

      return {
        ...previous,
        studies: previous.studies.concat({
          id: study.c_id,
          name: study.c_name,
          url: study.c_link,
          source: study.source,
        }),
      };
    });
  };

  const toggleVariable = (
    variable: NonNullable<DugStudy['elements']>[number],
  ) => {
    setCollection((previous) => {
      if (previous.variables.some((item) => item.id === variable.id)) {
        return {
          ...previous,
          variables: previous.variables.filter((item) => item.id !== variable.id),
        };
      }

      return {
        ...previous,
        variables: previous.variables.concat({
          id: variable.id,
          name: variable.name || variable.id,
          description: variable.description || '',
          url: variable.e_link || '',
        }),
      };
    });
  };

  const removeCollectionItem = (
    type: keyof DugCollection,
    id: string,
  ) => {
    setCollection((previous) => ({
      ...previous,
      [type]: previous[type].filter((item) => item.id !== id),
    }));
  };

  const clearCollection = () => setCollection(EMPTY_COLLECTION);

  const downloadCollection = () => {
    trackDugDownloadCollection(collection);

    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `BDC-Collection_${new Date().toISOString()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const loadMore = async () => {
    if (!query || !hasMore || isLoadingMore) {
      return;
    }

    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    setError(null);

    try {
      const data = await fetchConcepts(query, nextPage, PER_PAGE);
      setResults((previous) => previous.concat(data.hits));
      setCurrentPage(nextPage);
      setConceptTypes((previous) => {
        const merged = new Set(previous.concat(data.conceptTypes));
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
      });
    } catch {
      setError('Unable to load more results right now.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedResult(null);
  };

  return (
    <div className="grid-row grid-gap-3">
      <section className="desktop:grid-col-8">
        <div className="display-flex flex-column gap-2">
          <DugSearchBar
            id="dug-search-input"
            placeholder="Search disease, phenotype, process, or anatomy"
            submitLabel="Search"
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onClear={() => {
              setInputValue('');
              setQuery('');
            }}
          />

          <div className="display-block tablet:display-flex tablet:flex-justify flex-align-center margin-y-2">
            <p className="margin-y-0 text-base">{countText}</p>
            {query && conceptTypes.length > 0 && (
              <button
                type="button"
                className="usa-button usa-button--unstyled margin-top-1 tablet:margin-top-0"
                onClick={() => setFiltersOpen((previous) => !previous)}
                aria-expanded={filtersOpen}
                aria-controls="dug-filters-panel"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
                {activeFilters.length > 0
                  ? ` (${activeFilters.length})`
                  : ''}
              </button>
            )}
          </div>

          {query && conceptTypes.length > 0 && filtersOpen && (
            <>
              <button
                type="button"
                className={styles.filtersBackdrop}
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              />
              <div
                id="dug-filters-panel"
                className={`${styles.filtersPanel} border border-base-lighter radius-sm bg-base-lightest padding-2 margin-top-1`}
                aria-labelledby="dug-filter-heading"
              >
            <div className="display-flex flex-justify flex-align-center margin-bottom-1">
                <p id="dug-filter-heading" className="text-bold margin-y-0">Result types</p>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled font-body-xs"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="grid-row grid-gap">
                {conceptTypes.map((filter) => (
                  <label
                    key={filter}
                    className="tablet:grid-col-4 display-flex flex-align-center margin-bottom-1"
                  >
                    <input
                      type="checkbox"
                      className="margin-right-1"
                      checked={activeFilters.includes(filter)}
                      onChange={() => toggleFilter(filter)}
                    />
                    <span>{filter}</span>
                  </label>
                ))}
              </div>
              </div>
            </>
          )}

          {activeFilters.length > 0 && (
            <div className="minh-6 bg-white border border-base-lighter radius-md padding-1 margin-top-1">
              <span className="text-bold margin-right-1">Active filters:</span>
              {activeFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="usa-tag bg-primary-lighter text-ink margin-right-1 margin-bottom-1 cursor-pointer border-0"
                  onClick={() => toggleFilter(filter)}
                  aria-pressed="true"
                >
                  {filter} x
                </button>
              ))}
            </div>
          )}

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

          {!error && query && !isLoading && results.length > 0 && filteredResults.length === 0 && (
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
                          onClick={() => setSelectedResult(result)}
                        >
                          {result.name}
                        </button>
                      </h3>
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled font-body-2xs text-no-wrap margin-top-1 tablet:margin-top-0"
                        onClick={() => toggleConcept(result)}
                        aria-pressed={conceptInCollection(result.id)}
                      >
                        {conceptInCollection(result.id)
                          ? '- Remove from collection'
                          : '+ Add to collection'}
                      </button>
                    </div>

                    <p className="margin-y-1 line-height-sans-4 font-body-sm desktop:font-body-md">
                      {snipText(result.description || 'No description available.', 170)}
                    </p>

                    <div className="font-body-2xs desktop:font-body-xs text-base-dark display-flex flex-align-end flex-wrap gap-1 tablet:flex-justify margin-top-auto">
                      <span className="display-flex flex-align-center">
                        <Icon.Identification aria-hidden />
                        <code className="font-mono-2xs margin-left-05">{result.id}</code>
                      </span>
                      <span className="display-flex flex-align-center">
                        <TagPill
                          label={result.type || 'UNKNOWN'}
                          tone="cool"
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
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more results'}
              </button>
            </div>
          )}

          {!error && !isLoading && query && !hasMore && filteredResults.length > 0 && (
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
      </section>

      <aside className="desktop:grid-col-4 margin-top-3 desktop:margin-top-0">
        <div
          className={`${styles.collectionSticky} position-sticky border border-base-lighter radius-lg padding-2 bg-white shadow-1`}
        >
          <div className="display-flex flex-justify flex-align-start gap-1 margin-bottom-1">
            <div>
              <h2 className="font-heading-md margin-0">Collection</h2>
              <p className="margin-y-0 text-base-dark font-body-sm">Save for next steps</p>
            </div>
            <div className="display-flex flex-align-center">
              <button
                type="button"
                className="usa-button usa-button--unstyled radius-pill display-flex flex-align-center flex-justify-center margin-right-1"
                onClick={downloadCollection}
                disabled={collectionCount === 0}
                aria-label="Download collection"
                title="Download collection"
              >
                <Icon.FileDownload aria-hidden />
              </button>
              <TagPill label={`${collectionCount} items`} tone="neutral" />
            </div>
          </div>

          <details open className="border border-base-lighter radius-md bg-base-lightest padding-x-1 padding-y-105 margin-bottom-1">
            <summary className="text-bold cursor-pointer radius-sm padding-x-05">Concepts ({collection.concepts.length})</summary>
            <ul className="usa-list padding-left-05 margin-y-05 margin-x-05">
              {collection.concepts.map((item) => (
                <li key={`concept-${item.id}`} className="display-flex flex-justify flex-align-center padding-left-0 margin-y-05">
                  <span className="flex-1">{item.name}</span>
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled font-body-2xs text-secondary-dark text-no-wrap"
                    onClick={() => removeCollectionItem('concepts', item.id)}
                    aria-label={`Remove ${item.name} from concept collection`}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {collection.concepts.length === 0 && <li className="usa-list--unstyled text-base">None selected.</li>}
            </ul>
          </details>

          <details className="border border-base-lighter radius-md bg-base-lightest padding-x-1 padding-y-105 margin-bottom-1">
            <summary className="text-bold cursor-pointer radius-sm padding-x-05">Studies ({collection.studies.length})</summary>
            <ul className="usa-list padding-left-05 margin-y-05 margin-x-05">
              {collection.studies.map((item) => (
                <li key={`study-${item.id}`} className="display-flex flex-justify flex-align-center padding-left-0 margin-y-05">
                  <span className="flex-1">{item.name}</span>
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled font-body-2xs text-secondary-dark text-no-wrap"
                    onClick={() => removeCollectionItem('studies', item.id)}
                    aria-label={`Remove ${item.name} from study collection`}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {collection.studies.length === 0 && <li className="usa-list--unstyled text-base">None selected.</li>}
            </ul>
          </details>

          <details className="border border-base-lighter radius-md bg-base-lightest padding-x-1 padding-y-105">
            <summary className="text-bold cursor-pointer radius-sm padding-x-05">Variables ({collection.variables.length})</summary>
            <ul className="usa-list padding-left-05 margin-y-05 margin-x-05">
              {collection.variables.map((item) => (
                <li key={`var-${item.id}`} className="display-flex flex-justify flex-align-center padding-left-0 margin-y-05">
                  <span className="flex-1">{item.name}</span>
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled font-body-2xs text-secondary-dark text-no-wrap"
                    onClick={() => removeCollectionItem('variables', item.id)}
                    aria-label={`Remove ${item.name} from variable collection`}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {collection.variables.length === 0 && <li className="usa-list--unstyled text-base">None selected.</li>}
            </ul>
          </details>

          <div className="display-flex flex-column margin-top-2">
            <a
              className="usa-button usa-button--outline margin-bottom-2 radius-pill"
              href="/data/explore/dug/next-steps"
              onClick={() => {
                trackDugCheckoutCollection(collection);
              }}
            >
              Next steps
            </a>
            {collectionCount > 0 && (
              <button
                type="button"
                className="usa-button usa-button--unstyled font-body-xs flex-justify-end"
                onClick={clearCollection}
              >
                Clear collection
              </button>
            )}
          </div>
        </div>
      </aside>

      {selectedResult && (
        <div
          className="position-fixed top-0 right-0 bottom-0 left-0 z-top display-flex flex-align-center flex-justify-center padding-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dug-modal-title"
        >
          <div
            className="position-absolute top-0 right-0 bottom-0 left-0 bg-black opacity-70"
            onClick={closeDetailModal}
          />
          <div
            className={`${styles.modalPanel} position-relative bg-white radius-md shadow-5 minh-tablet-lg`}
            ref={modalPanelRef}
            tabIndex={-1}
            role="document"
          >
            <div className="position-sticky top-0 display-flex flex-justify flex-align-start padding-2 margin-bottom-2 bg-base-lightest">
              <div className="flex-1">
                <h2 id="dug-modal-title" className="margin-top-0 margin-bottom-05">
                  {selectedResult.name}
                </h2>
                <p className="margin-y-0 text-base-dark">{selectedResult.id}</p>
              </div>
                <button
                  type="button"
                  className="usa-button usa-button--unstyled text-bold"
                  onClick={closeDetailModal}
                  ref={closeButtonRef}
                >
                  Close
                </button>
            </div>

            <div className="padding-2">
              <p className="margin-top-0">{
                selectedResult.description || 'No description available.'
              }</p>
            </div>

            <div className="padding-2 display-flex gap-1 margin-bottom-2">
              <button
                type="button"
                className={`usa-button ${
                  activeDetailTab === 'studies' ? '' : 'usa-button--outline'
                }`}
                onClick={() => setActiveDetailTab('studies')}
                aria-selected={activeDetailTab === 'studies'}
              >
                Studies ({studiesLoading ? '...' : studies.length})
              </button>
              <button
                type="button"
                className={`usa-button ${
                  activeDetailTab === 'explanation' ? '' : 'usa-button--outline'
                }`}
                onClick={() => setActiveDetailTab('explanation')}
                aria-selected={activeDetailTab === 'explanation'}
              >
                Explanation
              </button>
            </div>

            {activeDetailTab === 'studies' && (
              <div className="padding-2">
                {studiesLoading && <p className="margin-y-0">Loading related studies...</p>}
                {studiesError && <p className="text-secondary-dark margin-y-0">{studiesError}</p>}
                {!studiesLoading && !studiesError && studies.length === 0 && (
                  <p className="margin-y-0">No associated studies were found for this concept.</p>
                )}
                {!studiesLoading && !studiesError && studies.length > 0 && (
                  <div className="display-flex flex-column gap-1">
                    {studies.map((study) => (
                      <details key={`${study.source}-${study.c_id}`} className="border border-base-lighter radius-sm padding-1 cursor-pointer">
                        <summary className="text-bold">{study.c_name}</summary>
                        <div className="display-flex flex-justify flex-align-center margin-top-1 margin-bottom-1 gap-1">
                          <p className="margin-y-0">
                            Study ID:{' '}
                            <a href={study.c_link} target="_blank" rel="noreferrer noopener">
                              {study.c_id}
                            </a>{' '}
                            <span className="text-base-dark">- {study.source}</span>
                          </p>
                          <button
                            type="button"
                            className="usa-button usa-button--unstyled font-body-xs"
                            onClick={() => toggleStudy(study)}
                            aria-pressed={studyInCollection(study.c_id)}
                          >
                            {studyInCollection(study.c_id)
                              ? '- Remove study'
                              : '+ Add study'}
                          </button>
                        </div>
                        <ul className="usa-list margin-top-0 margin-bottom-0">
                          {study.elements.map((variable) => (
                            <li key={`${study.c_id}-${variable.id}`}>
                              <span className="text-bold">{variable.name || variable.id}</span>
                              <span className="text-base-dark"> ({variable.id})</span>
                              <button
                                type="button"
                                className="usa-button usa-button--unstyled font-body-xs margin-left-1"
                                onClick={() => toggleVariable(variable)}
                                aria-pressed={variableInCollection(variable.id)}
                              >
                                {variableInCollection(variable.id)
                                  ? '- Remove variable'
                                  : '+ Add variable'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'explanation' && (
              <div className="padding-2 margin-top-1">
                <p className="margin-top-0">
                  Dug ranks concepts based on relevance across concept name,
                  description, and related search terms.
                </p>
                <pre className="bg-base-darkest text-base-lightest radius-sm padding-2 overflow-auto font-mono-2xs margin-bottom-0">
                  {JSON.stringify(selectedResult.explanation ?? {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
