import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';

export function trackFooterPrimaryLinkClick(
  section: string,
  label: string,
  href: string,
) {
  pushAnalyticsEvent({
    event: 'footer-primary-link-click',
    footerSection: section,
    footerLinkLabel: label,
    footerLinkHref: href,
  });
}

export function trackFooterIdentifierLinkClick(label: string, href: string) {
  pushAnalyticsEvent({
    event: 'footer-identifier-link-click',
    footerLinkLabel: label,
    footerLinkHref: href,
  });
}
