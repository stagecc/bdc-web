import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';

export function trackInPageNavHeadingClick(label: string, href: string) {
  pushAnalyticsEvent({
    event: 'in-page-nav-heading-click',
    inPageNavHeadingLabel: label,
    inPageNavHeadingHref: href,
  });
}

export function trackInPageNavBackToTopClick(href: string) {
  pushAnalyticsEvent({
    event: 'in-page-nav-back-to-top-click',
    inPageNavBackToTopHref: href,
  });
}
