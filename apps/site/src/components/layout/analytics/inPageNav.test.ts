// apps/site/src/components/layout/analytics/inPageNav.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { trackInPageNavInteraction } from './inPageNav';

vi.mock('../../../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

function absoluteUrl(path: string) {
  return new URL(path, window.location.href).href;
}

function requireElement<ElementType extends HTMLElement>(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element as ElementType;
}

describe('trackInPageNavInteraction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pushAnalyticsEventMock.mockReset();
  });

  it('tracks in-page nav link clicks', () => {
    document.body.innerHTML = `<a href="#main-content" id="target">Back to top</a>`;

    trackInPageNavInteraction(requireElement<HTMLAnchorElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'in_page_nav_item_click',
      site_section: 'in_page_nav',
      element_type: 'a',
      element_text: 'Back to top',
      element_url: absoluteUrl('#main-content'),
      page_path: '/',
    });
  });

  it('tracks in-page nav button clicks', () => {
    document.body.innerHTML = `<button type="button" id="target">Jump to section</button>`;

    trackInPageNavInteraction(requireElement<HTMLButtonElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'in_page_nav_item_click',
      site_section: 'in_page_nav',
      element_type: 'button',
      element_text: 'Jump to section',
      element_url: undefined,
      page_path: '/',
    });
  });
});
