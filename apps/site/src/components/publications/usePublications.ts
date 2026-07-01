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

export function usePublications(publications: Publication[]) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('most-recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let result = publications;

    // Apply filters first
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

    // Then search within filtered set
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

    // Then sort
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

  // Reset visible count when search/filters/sort change
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
      return { ...prev, [key]: next };
    });
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSearch(term: string) {
    setSearch(term);
    setVisibleCount(PAGE_SIZE);
  }

  function updateSort(option: SortOption) {
    setSort(option);
    setVisibleCount(PAGE_SIZE);
  }

  // Derive filter options with counts from the currently filtered set
  // (ignoring the filter dimension being counted, so counts reflect other active filters)
  const filterOptions = useMemo(() => {
    // Seed all known values from the full dataset with 0 counts
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

    // Year counts — ignore active year filters, respect everything else
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

    // Research Community counts — ignore active community filters, respect everything else
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

    // Research Area counts — ignore active area filters, respect everything else
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

    // Org Contribution counts — ignore active org filters, respect everything else
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

    return { years, researchCommunities, researchAreas, bdcContributions };
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
    updateSort,
    loadMore,
  };
}
