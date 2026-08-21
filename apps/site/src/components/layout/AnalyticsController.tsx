import { useEffect } from 'react';
import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';
import { trackFooterInteraction } from './analytics/footer';
import { trackInPageNavInteraction } from './analytics/inPageNav';
import { trackNavInteraction } from './analytics/nav';
import {
  type AnalyticsElement,
  getAnalyticsEvent,
  getAnalyticsSection,
  getElementText,
  getEventElement,
  getInteractiveElement,
} from './analytics/shared';

type AnalyticsWindow = Window & {
  __bdcLastTrackedPath?: string;
};

function trackPageView() {
  const analyticsWindow = window as AnalyticsWindow;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (analyticsWindow.__bdcLastTrackedPath === path) return;

  analyticsWindow.__bdcLastTrackedPath = path;
  pushAnalyticsEvent({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_search: window.location.search,
  });
}

function pushCustomAnalyticsEvent(target: AnalyticsElement) {
  const eventName = getAnalyticsEvent(target);
  if (!eventName) return;

  const section = getAnalyticsSection(target);
  const elementText = getElementText(target);

  pushAnalyticsEvent({
    event: eventName,
    site_section: section ?? undefined,
    element_type: target instanceof HTMLAnchorElement ? 'a' : 'button',
    element_text: elementText,
    element_url: target instanceof HTMLAnchorElement ? target.href : undefined,
    page_path: window.location.pathname,
  });
}

export function AnalyticsController() {
  useEffect(() => {
    trackPageView();

    const handleNavigation = () => {
      trackPageView();
    };

    const handleClick = (event: MouseEvent) => {
      const target = getEventElement(event.target);

      if (!target) return;

      const interactiveElement = getInteractiveElement(target);

      if (!interactiveElement) return;

      switch (getAnalyticsSection(interactiveElement)) {
        case 'header':
          trackNavInteraction(interactiveElement);
          return;
        case 'footer':
          trackFooterInteraction(interactiveElement);
          return;
        case 'in_page_nav':
          trackInPageNavInteraction(interactiveElement);
          return;
        default:
          pushCustomAnalyticsEvent(interactiveElement);
      }
    };

    document.addEventListener('astro:after-swap', handleNavigation);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('astro:after-swap', handleNavigation);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
