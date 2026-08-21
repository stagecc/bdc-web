import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { type AnalyticsElement, getElementText } from './shared';

export function trackInPageNavInteraction(target: AnalyticsElement) {
  const elementText = getElementText(target);
  const elementUrl =
    target instanceof HTMLAnchorElement ? target.href : undefined;

  pushAnalyticsEvent({
    event: 'in_page_nav_item_click',
    site_section: 'in_page_nav',
    element_type: target instanceof HTMLAnchorElement ? 'a' : 'button',
    element_text: elementText,
    element_url: elementUrl,
    page_path: window.location.pathname,
  });
}
