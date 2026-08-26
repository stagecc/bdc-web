import type { FormEvent } from 'react';
import { useEffect, useMemo } from 'react';
import {
  trackDugCheckoutCollection,
  trackDugDownloadCollection,
  trackDugSearch,
  useDugCollection,
} from '../shared';
import DugCollectionPanel from './DugCollectionPanel';
import DugConceptDetailPanel from './DugConceptDetailPanel';
import DugFiltersPanel from './DugFiltersPanel';
import DugResultsList from './DugResultsList';
import styles from './DugSearchApp.module.scss';
import { useDugDetailPanel } from './hooks/useDugDetailPanel';
import { useDugSearch } from './hooks/useDugSearch';

export default function DugSearchApp() {
  const {
    activeFilters,
    clearFilters,
    clearSearch,
    conceptTypes,
    countText,
    error,
    filteredResults,
    filtersOpen,
    hasMore,
    inputValue,
    isLoading,
    isLoadingMore,
    loadMore,
    query,
    results,
    setFiltersOpen,
    setInputValue,
    submitSearch,
    toggleFilter,
  } = useDugSearch();
  const {
    clearCollection,
    collection,
    collectionCount,
    conceptInCollection,
    removeCollectionItem,
    studyInCollection,
    toggleConcept,
    toggleStudy,
    toggleVariable,
    variableInCollection,
  } = useDugCollection();
  const {
    activeDetailTab,
    closeButtonRef,
    closeDetailPanel,
    handleDetailPanelExited,
    isDetailClosing,
    modalPanelRef,
    openDetailPanel,
    selectedResult,
    setActiveDetailTab,
    studies,
    studiesError,
    studiesLoading,
  } = useDugDetailPanel(query);
  const shortcutLabel = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return 'Ctrl K';
    }

    const platform = navigator.platform.toLowerCase();
    return platform.includes('mac') ? 'Cmd K' : 'Ctrl K';
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== 'k'
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchLocation =
      window.location.pathname === '/'
        ? 'BDC Home'
        : window.location.pathname.includes('/data/explore/dug')
          ? 'Dug Search Page'
          : window.location.pathname;

    trackDugSearch(inputValue.trim(), searchLocation);

    submitSearch();
  };

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

  const toggleFiltersOpen = () => {
    setFiltersOpen((previous) => !previous);
  };

  return (
    <div className="grid-row grid-gap-3">
      <section className="desktop:grid-col-8">
        <DugResultsList
          inputValue={inputValue}
          shortcutLabel={shortcutLabel}
          onInputChange={setInputValue}
          onSearchSubmit={handleSubmit}
          onSearchClear={clearSearch}
          countText={countText}
          query={query}
          error={error}
          isLoading={isLoading}
          results={results}
          filteredResults={filteredResults}
          onSelectResult={openDetailPanel}
          onToggleConcept={toggleConcept}
          conceptInCollection={conceptInCollection}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      </section>

      <aside className="desktop:grid-col-4 margin-top-3 desktop:margin-top-0">
        <div className={`${styles.collectionSticky} position-sticky`}>
          <DugFiltersPanel
            query={query}
            conceptTypes={conceptTypes}
            filtersOpen={filtersOpen}
            activeFilters={activeFilters}
            onToggleFiltersOpen={toggleFiltersOpen}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
          />
          <DugCollectionPanel
            collection={collection}
            collectionCount={collectionCount}
            onDownloadCollection={downloadCollection}
            onRemoveCollectionItem={removeCollectionItem}
            onClearCollection={clearCollection}
            onCheckoutCollection={() => trackDugCheckoutCollection(collection)}
          />
        </div>
      </aside>

      <DugConceptDetailPanel
        selectedResult={selectedResult}
        isClosing={isDetailClosing}
        onClose={closeDetailPanel}
        onExited={handleDetailPanelExited}
        modalPanelRef={modalPanelRef}
        closeButtonRef={closeButtonRef}
        activeDetailTab={activeDetailTab}
        onChangeDetailTab={setActiveDetailTab}
        studiesLoading={studiesLoading}
        studiesError={studiesError}
        studies={studies}
        onToggleStudy={toggleStudy}
        studyInCollection={studyInCollection}
        onToggleVariable={toggleVariable}
        variableInCollection={variableInCollection}
      />
    </div>
  );
}
