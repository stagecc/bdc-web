import { observeSearchResults } from './enhance-search-results';

type SearchModalElement = HTMLElement & {
  open?: () => void;
};

type WindowWithSearchModalFlag = Window & {
  bdcSearchModalListenersReady?: boolean;
};

function getSearchModal(): SearchModalElement | null {
  return document.querySelector('pagefind-modal[instance="site-modal"]');
}

function openSearchModal(): void {
  const modal = getSearchModal();
  if (!modal || typeof modal.open !== 'function') return;
  modal.open();
}

type Navigate = (url: string) => void;

const navigate: Navigate = (url) => {
  window.location.href = url;
};

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

export function initSearchModal(): void {
  const globalWindow = window as WindowWithSearchModalFlag;
  if (!globalWindow.bdcSearchModalListenersReady) {
    globalWindow.bdcSearchModalListenersReady = true;
    window.addEventListener('bdc:open-search-modal', openSearchModal);
    document.addEventListener('keydown', handleSearchModalEnter);
  }

  const modal = getSearchModal();
  if (modal) observeSearchResults(modal);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchModal);
} else {
  initSearchModal();
}

document.addEventListener('astro:page-load', initSearchModal);
