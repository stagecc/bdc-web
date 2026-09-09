import { useEffect, useMemo, useState } from 'react';
import type { DugConcept } from '../api';
import { fetchConcepts } from '../api';
import { useQueryParam } from '../useQueryParam';

const PER_PAGE = 30;

export function useDugSearch() {
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

  useEffect(() => {
    setInputValue(query);
  }, [query]);

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
        setConceptTypes(
          [...data.conceptTypes].sort((a, b) => a.localeCompare(b)),
        );
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

  const filteredResults = useMemo(() => {
    if (activeFilters.length === 0) {
      return results;
    }

    return results.filter((result) => activeFilters.includes(result.type));
  }, [activeFilters, results]);

  const pageCount = useMemo(
    () => Math.ceil(totalItems / PER_PAGE),
    [totalItems],
  );

  const hasMore = useMemo(
    () => Boolean(query) && currentPage < pageCount,
    [currentPage, pageCount, query],
  );

  const countText = useMemo(() => {
    if (!query) {
      return 'Search concepts, studies, and variables in BDC.';
    }

    if (isLoading) {
      return `Searching for "${query}"...`;
    }

    if (activeFilters.length === 0) {
      return `${totalItems.toLocaleString()} matching concept${
        totalItems === 1 ? '' : 's'
      } for "${query}"`;
    }

    return filteredResults.length < totalItems
      ? `Showing ${filteredResults.length.toLocaleString()} of ${totalItems.toLocaleString()} concepts matching "${query}"`
      : `${filteredResults.length.toLocaleString()} concepts matching "${query}"`;
  }, [
    activeFilters.length,
    filteredResults.length,
    isLoading,
    query,
    totalItems,
  ]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((previous) =>
      previous.includes(filter)
        ? previous.filter((item) => item !== filter)
        : previous.concat(filter),
    );
  };

  const clearFilters = () => setActiveFilters([]);

  const submitSearch = () => {
    setQuery(inputValue);
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
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

  return {
    query,
    totalItems,
    inputValue,
    setInputValue,
    results,
    conceptTypes,
    activeFilters,
    filtersOpen,
    setFiltersOpen,
    isLoading,
    isLoadingMore,
    error,
    filteredResults,
    hasMore,
    countText,
    toggleFilter,
    clearFilters,
    submitSearch,
    clearSearch,
    loadMore,
  };
}
