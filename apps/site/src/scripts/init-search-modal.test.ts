import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../util/google-analytics/pushAnalyticsEvent';
import { handleSearchModalEnter, initSearchModal } from './init-search-modal';

vi.mock('../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

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
    pushAnalyticsEventMock.mockReset();
  });

  it('opens the site modal when the header dispatches its open event', () => {
    const modal = renderModal();
    initSearchModal();

    window.dispatchEvent(new CustomEvent('bdc:open-search-modal'));

    expect(modal.open).toHaveBeenCalledOnce();
  });

  it('navigates a modal query on Enter', () => {
    const modal = renderModal();
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
    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'search_submit',
      search_term: 'kidney disease',
      search_surface: 'modal',
      page_path: '/',
    });
    expect(navigate).toHaveBeenCalledWith('/search?q=kidney%20disease');
  });

  it('does not track empty modal queries on Enter', () => {
    const modal = renderModal();
    const input = document.createElement('input');
    input.value = '   ';
    modal.appendChild(input);
    const navigate = vi.fn();
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });

    handleSearchModalEnter(event, navigate);

    expect(pushAnalyticsEventMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
