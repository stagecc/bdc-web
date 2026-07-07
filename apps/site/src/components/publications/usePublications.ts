import { useMemo, useState } from 'react';

const PAGE_SIZE = 20;

export type Publication = {
  title: string;
  date: string;
  journalName: string;
  url: string;
  status?: string;
  bdcContribution?: string[];
  researchArea?: string[];
  researchCommunity?: string[];
};

export type SortOption =
  | 'most-recent'
  | 'least-recent'
  | 'title-az'
  | 'title-za';

export type Filters = {
  year: string[];
  researchCommunity: string[];
  researchArea: string[];
  bdcContribution: string[];
};

const EMPTY_FILTERS: Filters = {
  year: [],
  researchCommunity: [],
  researchArea: [],
  bdcContribution: [],
};

const VALID_SORT_OPTIONS: SortOption[] = [
  'most-recent',
  'least-recent',
  'title-az',
  'title-za',
];

function readParamsFromURL(): {
  search: string;
  filters: Filters;
  sort: SortOption;
} {
  if (typeof window === 'undefined') {
    return { search: '', filters: EMPTY_FILTERS, sort: 'most-recent' };
  }

  const params = new URLSearchParams(window.location.search);

  const search = params.get('search') ?? '';

  const sort = VALID_SORT_OPTIONS.includes(params.get('sort') as SortOption)
    ? (params.get('sort') as SortOption)
    : 'most-recent';

  const filters: Filters = {
    year: params.getAll('year'),
    researchCommunity: params.getAll('researchCommunity'),
    researchArea: params.getAll('researchArea'),
    bdcContribution: params.getAll('bdcContribution'),
  };

  return { search, filters, sort };
}

function writeParamsToURL(search: string, filters: Filters, sort: SortOption) {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams();

  if (search) params.set('search', search);
  if (sort !== 'most-recent') params.set('sort', sort);

  for (const year of filters.year) params.append('year', year);
  for (const rc of filters.researchCommunity)
    params.append('researchCommunity', rc);
  for (const ra of filters.researchArea) params.append('researchArea', ra);
  for (const oc of filters.bdcContribution)
    params.append('bdcContribution', oc);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  // NOTE: using replaceState — does not add browser history entries per filter change.
  // Switch to pushState if back-button navigation through filter states is desired.
  window.history.replaceState(null, '', newUrl);
}

export function usePublications(publications: Publication[]) {
  const initial = readParamsFromURL();

  const [search, setSearch] = useState(initial.search);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let result = publications;

    if (filters.year.length > 0) {
      result = result.filter((pub) =>
        filters.year.includes(String(new Date(pub.date).getFullYear())),
      );
    }
    if (filters.researchCommunity.length > 0) {
      result = result.filter((pub) =>
        pub.researchCommunity?.some((rc) =>
          filters.researchCommunity.includes(rc),
        ),
      );
    }
    if (filters.researchArea.length > 0) {
      result = result.filter((pub) =>
        pub.researchArea?.some((ra) => filters.researchArea.includes(ra)),
      );
    }
    if (filters.bdcContribution.length > 0) {
      result = result.filter((pub) =>
        pub.bdcContribution?.some((oc) => filters.bdcContribution.includes(oc)),
      );
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (pub) =>
          pub.title.toLowerCase().includes(term) ||
          pub.journalName.toLowerCase().includes(term) ||
          pub.url.toLowerCase().includes(term) ||
          pub.researchCommunity?.some((rc) => rc.toLowerCase().includes(term)),
      );
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'most-recent':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'least-recent':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [publications, search, filters, sort]);

  const visible = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  function loadMore() {
    setVisibleCount((c) => c + PAGE_SIZE);
  }

  function toggleFilter(key: keyof Filters, value: string) {
    setFilters((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [key]: next };
      writeParamsToURL(search, updated, sort);
      return updated;
    });
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    writeParamsToURL(search, EMPTY_FILTERS, sort);
    setVisibleCount(PAGE_SIZE);
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS);
    setSearch('');
    writeParamsToURL('', EMPTY_FILTERS, sort);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSearch(term: string) {
    setSearch(term);
    writeParamsToURL(term, filters, sort);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSort(option: SortOption) {
    setSort(option);
    writeParamsToURL(search, filters, option);
    setVisibleCount(PAGE_SIZE);
  }

  const filterOptions = useMemo(() => {
    const years = new Map<string, number>();
    const researchCommunities = new Map<string, number>();
    const researchAreas = new Map<string, number>();
    const bdcContributions = new Map<string, number>();

    for (const pub of publications) {
      const year = String(new Date(pub.date).getFullYear());
      if (!years.has(year)) years.set(year, 0);
      for (const rc of pub.researchCommunity ?? []) {
        if (!researchCommunities.has(rc)) researchCommunities.set(rc, 0);
      }
      for (const ra of pub.researchArea ?? []) {
        if (!researchAreas.has(ra)) researchAreas.set(ra, 0);
      }
      for (const oc of pub.bdcContribution ?? []) {
        if (!bdcContributions.has(oc)) bdcContributions.set(oc, 0);
      }
    }

    const applySearch = (pubs: Publication[]) => {
      if (!search.trim()) return pubs;
      const term = search.trim().toLowerCase();
      return pubs.filter(
        (pub) =>
          pub.title.toLowerCase().includes(term) ||
          pub.journalName.toLowerCase().includes(term) ||
          pub.url.toLowerCase().includes(term) ||
          pub.researchCommunity?.some((rc) => rc.toLowerCase().includes(term)),
      );
    };

    const forYearCounts = applySearch(
      publications.filter((pub) => {
        const inCommunity =
          filters.researchCommunity.length === 0 ||
          pub.researchCommunity?.some((rc) =>
            filters.researchCommunity.includes(rc),
          );
        const inArea =
          filters.researchArea.length === 0 ||
          pub.researchArea?.some((ra) => filters.researchArea.includes(ra));
        const inOrg =
          filters.bdcContribution.length === 0 ||
          pub.bdcContribution?.some((oc) =>
            filters.bdcContribution.includes(oc),
          );
        return inCommunity && inArea && inOrg;
      }),
    );

    for (const pub of forYearCounts) {
      const year = String(new Date(pub.date).getFullYear());
      years.set(year, (years.get(year) ?? 0) + 1);
    }

    const forCommunityCounts = applySearch(
      publications.filter((pub) => {
        const inYear =
          filters.year.length === 0 ||
          filters.year.includes(String(new Date(pub.date).getFullYear()));
        const inArea =
          filters.researchArea.length === 0 ||
          pub.researchArea?.some((ra) => filters.researchArea.includes(ra));
        const inOrg =
          filters.bdcContribution.length === 0 ||
          pub.bdcContribution?.some((oc) =>
            filters.bdcContribution.includes(oc),
          );
        return inYear && inArea && inOrg;
      }),
    );

    for (const pub of forCommunityCounts) {
      for (const rc of pub.researchCommunity ?? []) {
        researchCommunities.set(rc, (researchCommunities.get(rc) ?? 0) + 1);
      }
    }

    const forAreaCounts = applySearch(
      publications.filter((pub) => {
        const inYear =
          filters.year.length === 0 ||
          filters.year.includes(String(new Date(pub.date).getFullYear()));
        const inCommunity =
          filters.researchCommunity.length === 0 ||
          pub.researchCommunity?.some((rc) =>
            filters.researchCommunity.includes(rc),
          );
        const inOrg =
          filters.bdcContribution.length === 0 ||
          pub.bdcContribution?.some((oc) =>
            filters.bdcContribution.includes(oc),
          );
        return inYear && inCommunity && inOrg;
      }),
    );

    for (const pub of forAreaCounts) {
      for (const ra of pub.researchArea ?? []) {
        researchAreas.set(ra, (researchAreas.get(ra) ?? 0) + 1);
      }
    }

    const forOrgCounts = applySearch(
      publications.filter((pub) => {
        const inYear =
          filters.year.length === 0 ||
          filters.year.includes(String(new Date(pub.date).getFullYear()));
        const inCommunity =
          filters.researchCommunity.length === 0 ||
          pub.researchCommunity?.some((rc) =>
            filters.researchCommunity.includes(rc),
          );
        const inArea =
          filters.researchArea.length === 0 ||
          pub.researchArea?.some((ra) => filters.researchArea.includes(ra));
        return inYear && inCommunity && inArea;
      }),
    );

    for (const pub of forOrgCounts) {
      for (const oc of pub.bdcContribution ?? []) {
        bdcContributions.set(oc, (bdcContributions.get(oc) ?? 0) + 1);
      }
    }

    const sortedYears = new Map(
      [...years.entries()].sort((a, b) => Number(b[0]) - Number(a[0])),
    );
    const sortedCommunities = new Map(
      [...researchCommunities.entries()].sort((a, b) => b[1] - a[1]),
    );
    const sortedAreas = new Map(
      [...researchAreas.entries()].sort((a, b) => b[1] - a[1]),
    );
    const sortedOrgs = new Map(
      [...bdcContributions.entries()].sort((a, b) => b[1] - a[1]),
    );

    return {
      years: sortedYears,
      researchCommunities: sortedCommunities,
      researchAreas: sortedAreas,
      bdcContributions: sortedOrgs,
    };
  }, [publications, search, filters]);

  const hasActiveFilters = Object.values(filters).some((f) => f.length > 0);
  const hasMore = visibleCount < filtered.length;

  return {
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
  };
}
