import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { type AnalyticsElement, getElementText } from './shared';

export function trackNavInteraction(target: AnalyticsElement) {
  const elementText = getElementText(target);
  const elementUrl =
    target instanceof HTMLAnchorElement ? target.href : undefined;

  if (
    target instanceof HTMLButtonElement &&
    target.hasAttribute('aria-expanded')
  ) {
    const isExpanded = target.getAttribute('aria-expanded') === 'true';

    pushAnalyticsEvent({
      event: `header_item_${isExpanded ? 'expand' : 'collapse'}`,
      site_section: 'header',
      element_type: 'button',
      element_text: elementText,
      page_path: window.location.pathname,
    });

    return;
  }

  pushAnalyticsEvent({
    event: 'header_item_click',
    site_section: 'header',
    element_type: target instanceof HTMLAnchorElement ? 'a' : 'button',
    element_text: elementText,
    element_url: elementUrl,
    page_path: window.location.pathname,
  });
}
