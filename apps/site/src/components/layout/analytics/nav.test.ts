// apps/site/src/components/layout/analytics/nav.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { trackNavInteraction } from './nav';

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

describe('trackNavInteraction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pushAnalyticsEventMock.mockReset();
  });

  it('tracks generic header link clicks', () => {
    document.body.innerHTML = `<a href="/about" id="target">About</a>`;

    trackNavInteraction(requireElement<HTMLAnchorElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'header_item_click',
      site_section: 'header',
      element_type: 'a',
      element_text: 'About',
      element_url: absoluteUrl('/about'),
      page_path: '/',
    });
  });

  it('tracks generic header button clicks', () => {
    document.body.innerHTML = `<button type="button" id="target">Menu</button>`;

    trackNavInteraction(requireElement<HTMLButtonElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'header_item_click',
      site_section: 'header',
      element_type: 'button',
      element_text: 'Menu',
      element_url: undefined,
      page_path: '/',
    });
  });

  it('tracks expandable header buttons as expand events', () => {
    document.body.innerHTML = `
      <button type="button" id="target" aria-expanded="true">Menu</button>
    `;

    trackNavInteraction(requireElement<HTMLButtonElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'header_item_expand',
      site_section: 'header',
      element_type: 'button',
      element_text: 'Menu',
      page_path: '/',
    });
  });

  it('tracks expandable header buttons as collapse events', () => {
    document.body.innerHTML = `
      <button type="button" id="target" aria-expanded="false">Menu</button>
    `;

    trackNavInteraction(requireElement<HTMLButtonElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'header_item_collapse',
      site_section: 'header',
      element_type: 'button',
      element_text: 'Menu',
      page_path: '/',
    });
  });
});
