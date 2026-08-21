import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { type AnalyticsElement, getElementText } from './shared';

export function trackFooterInteraction(target: AnalyticsElement) {
  const elementText = getElementText(target);
  const elementUrl =
    target instanceof HTMLAnchorElement ? target.href : undefined;

  pushAnalyticsEvent({
    event: 'footer_item_click',
    site_section: 'footer',
    element_type: target instanceof HTMLAnchorElement ? 'a' : 'button',
    element_text: elementText,
    element_url: elementUrl,
    page_path: window.location.pathname,
  });
}
