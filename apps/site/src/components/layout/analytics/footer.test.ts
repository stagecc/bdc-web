// apps/site/src/components/layout/analytics/footer.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { trackFooterInteraction } from './footer';

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

describe('trackFooterInteraction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pushAnalyticsEventMock.mockReset();
  });

  it('tracks footer link clicks', () => {
    document.body.innerHTML = `<a href="/data" id="target">Data</a>`;

    trackFooterInteraction(requireElement<HTMLAnchorElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'footer_item_click',
      site_section: 'footer',
      element_type: 'a',
      element_text: 'Data',
      element_url: absoluteUrl('/data'),
      page_path: '/',
    });
  });

  it('tracks footer button clicks', () => {
    document.body.innerHTML = `<button type="button" id="target">Contact Us</button>`;

    trackFooterInteraction(requireElement<HTMLButtonElement>('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'footer_item_click',
      site_section: 'footer',
      element_type: 'button',
      element_text: 'Contact Us',
      element_url: undefined,
      page_path: '/',
    });
  });
});
