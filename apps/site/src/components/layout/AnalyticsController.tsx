import { useEffect } from 'react';
import { pushAnalyticsEvent } from '../../util/google-analytics/pushAnalyticsEvent';
import { trackFooterInteraction } from './analytics/footer';
import { getTrackedForm, trackFormSubmitAttempt } from './analytics/forms';
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

function getLinkType(target: HTMLAnchorElement) {
  return new URL(target.href, window.location.href).origin ===
    window.location.origin
    ? 'internal'
    : 'external';
}

function trackGenericLinkClick(target: HTMLAnchorElement) {
  pushAnalyticsEvent({
    event: 'link_click',
    site_section: getAnalyticsSection(target) ?? undefined,
    link_type: getLinkType(target),
    element_type: 'a',
    element_text: getElementText(target),
    element_url: target.href,
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
      }

      if (getAnalyticsEvent(interactiveElement)) {
        pushCustomAnalyticsEvent(interactiveElement);
        return;
      }

      if (interactiveElement instanceof HTMLAnchorElement) {
        trackGenericLinkClick(interactiveElement);
      }
    };

    const handleSubmit = (event: SubmitEvent) => {
      const target = getEventElement(event.target);

      if (!target) return;

      const form = getTrackedForm(target);

      if (!form) return;

      trackFormSubmitAttempt(form);
    };

    document.addEventListener('astro:after-swap', handleNavigation);
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('astro:after-swap', handleNavigation);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);

  return null;
}
