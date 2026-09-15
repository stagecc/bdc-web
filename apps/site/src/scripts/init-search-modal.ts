import { observeSearchResults } from './enhance-search-results';

type SearchModalElement = HTMLElement & {
  open?: () => void;
};

type WindowWithSearchModalFlag = Window & {
  bdcSearchModalListenersReady?: boolean;
};

/** Returns the site search modal element, if it is on the page. */
function getSearchModal(): SearchModalElement | null {
  return document.querySelector('pagefind-modal[instance="site-modal"]');
}

/** Opens the Pagefind search modal when its custom element is available. */
function openSearchModal(): void {
  const modal = getSearchModal();
  if (!modal) return;

  if (typeof modal.open === 'function') {
    modal.open();
    return;
  }

  void customElements.whenDefined('pagefind-modal').then(() => {
    const upgradedModal = getSearchModal();
    if (!upgradedModal || typeof upgradedModal.open !== 'function') return;

    upgradedModal.open();
  });
}

type Navigate = (url: string) => void;

const navigate: Navigate = (url) => {
  window.location.href = url;
};

/**
 * On Enter in the modal search input, go to `/search?q=...` instead of
 * staying in the overlay.
 */
export function handleSearchModalEnter(
  event: KeyboardEvent,
  navigateToResults: Navigate = navigate,
): void {
  if (event.key !== 'Enter' || event.isComposing) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const modal = getSearchModal();
  if (!modal?.contains(target)) return;

  const query = target.value.trim();
  if (!query) return;

  event.preventDefault();
  navigateToResults(`/search?q=${encodeURIComponent(query)}`);
}

/**
 * Binds the open-modal event, Enter-to-search-page behavior, and
 * result-row enhancement inside the modal.
 */
export function initSearchModal(): void {
  const globalWindow = window as WindowWithSearchModalFlag;
  if (!globalWindow.bdcSearchModalListenersReady) {
    globalWindow.bdcSearchModalListenersReady = true;
    window.addEventListener('bdc:open-search-modal', openSearchModal);
    document.addEventListener('keydown', handleSearchModalEnter);
  }

  const modal = getSearchModal();
  if (!modal) return;

  observeSearchResults(modal);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchModal);
} else {
  initSearchModal();
}

document.addEventListener('astro:page-load', initSearchModal);
