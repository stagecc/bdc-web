import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleSearchModalEnter, initSearchModal } from './init-search-modal';

type TestSearchModal = HTMLElement & {
  open: ReturnType<typeof vi.fn>;
};

function renderModal(): TestSearchModal {
  const modal = document.createElement('pagefind-modal') as TestSearchModal;
  modal.setAttribute('instance', 'site-modal');
  modal.open = vi.fn();
  document.body.appendChild(modal);
  return modal;
}

describe('search modal initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the site modal when the header dispatches its open event', () => {
    const modal = renderModal();
    modal.setAttribute(
      'data-analytics-search-submit-event',
      'site_search_submit',
    );
    modal.setAttribute('data-analytics-search-location', 'modal');
    initSearchModal();

    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));

    expect(modal.open).toHaveBeenCalledOnce();
  });

  it('waits for the modal custom element to upgrade before opening', async () => {
    const modal = document.createElement('pagefind-modal') as TestSearchModal;
    modal.setAttribute('instance', 'site-modal');
    document.body.appendChild(modal);

    const originalWhenDefined = customElements.whenDefined.bind(customElements);
    const whenDefined = vi.fn(async (name: string) => {
      await Promise.resolve();
      if (name === 'pagefind-modal') {
        modal.open = vi.fn();
      }
    });

    customElements.whenDefined = whenDefined;

    try {
      initSearchModal();

      window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));
      await Promise.resolve();
      await vi.waitFor(() => expect(modal.open).toHaveBeenCalledOnce());

      expect(whenDefined).toHaveBeenCalledWith('pagefind-modal');
    } finally {
      customElements.whenDefined = originalWhenDefined;
    }
  });

  it('navigates a modal query on Enter', () => {
    const modal = renderModal();
    modal.setAttribute(
      'data-analytics-search-submit-event',
      'site_search_submit',
    );
    modal.setAttribute('data-analytics-search-location', 'modal');
    const input = document.createElement('input');
    input.value = ' kidney disease ';
    modal.appendChild(input);
    const navigate = vi.fn();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });

    handleSearchModalEnter(event, navigate);

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/search?q=kidney%20disease');
  });
});
