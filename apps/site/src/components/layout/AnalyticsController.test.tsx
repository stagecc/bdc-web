// apps/site/src/components/layout/AnalyticsController.test.tsx

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';
import { AnalyticsController } from './AnalyticsController';

vi.mock('../../util/google-analytics/pushAnalyticsEvent', () => ({
  pushAnalyticsEvent: vi.fn(),
}));

type AnalyticsWindow = Window & {
  __bdcLastTrackedPath?: string;
};

const pushAnalyticsEventMock = vi.mocked(pushAnalyticsEvent);

function absoluteUrl(path: string) {
  return new URL(path, window.location.href).href;
}

function requireElement(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Expected element #${id} to exist`);
  }

  return element;
}

function renderController() {
  render(<AnalyticsController />);
  pushAnalyticsEventMock.mockClear();
}

function appendFixture(markup: string) {
  document.body.insertAdjacentHTML('beforeend', markup);

  for (const anchor of document.querySelectorAll('a')) {
    anchor.addEventListener('click', (event) => event.preventDefault());
  }
}

describe('AnalyticsController', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    delete (window as AnalyticsWindow).__bdcLastTrackedPath;
    pushAnalyticsEventMock.mockReset();
  });

  it('routes delegated header clicks to nav analytics', () => {
    renderController();
    appendFixture(`
      <div data-analytics-section="header">
        <a href="/about" id="link"><span id="target">About</span></a>
      </div>
    `);

    fireEvent.click(requireElement('target'));

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

  it('routes delegated header button clicks to nav analytics', () => {
    renderController();
    appendFixture(`
      <div data-analytics-section="header">
        <button type="button" id="button"><span id="target">Menu</span></button>
      </div>
    `);

    fireEvent.click(requireElement('target'));

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

  it('routes delegated footer clicks to footer analytics', () => {
    renderController();
    appendFixture(`
      <footer data-analytics-section="footer">
        <a href="/data" id="link"><span id="target">Data</span></a>
      </footer>
    `);

    fireEvent.click(requireElement('target'));

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

  it('routes delegated in-page nav clicks to in-page nav analytics', () => {
    renderController();
    appendFixture(`
      <aside data-analytics-section="in_page_nav">
        <a href="#main-content" id="link"><span id="target">Back to top</span></a>
      </aside>
    `);

    fireEvent.click(requireElement('target'));

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

  it('falls back to a custom analytics event outside known sections', () => {
    renderController();
    appendFixture(`
      <div data-analytics-section="home_hero" data-analytics-custom-event="hero_cta_click">
        <a href="/get-started" id="link"><span id="target">Get Started</span></a>
      </div>
    `);

    fireEvent.click(requireElement('target'));

    expect(pushAnalyticsEventMock).toHaveBeenCalledTimes(1);
    expect(pushAnalyticsEventMock).toHaveBeenCalledWith({
      event: 'hero_cta_click',
      site_section: 'home_hero',
      element_type: 'a',
      element_text: 'Get Started',
      element_url: absoluteUrl('/get-started'),
      page_path: '/',
    });
  });

  it('ignores clicks on non-interactive wrappers', () => {
    renderController();
    appendFixture(`
      <footer data-analytics-section="footer">
        <div id="target">Footer whitespace</div>
      </footer>
    `);

    fireEvent.click(requireElement('target'));

    expect(pushAnalyticsEventMock).not.toHaveBeenCalled();
  });

  it('prefers known section handlers over custom event fallback', () => {
    renderController();
    appendFixture(`
      <div data-analytics-section="header" data-analytics-custom-event="hero_cta_click">
        <a href="/about" id="link"><span id="target">About</span></a>
      </div>
    `);

    fireEvent.click(requireElement('target'));

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
});
