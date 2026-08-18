import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';

export function trackNavLinkClick(label: string, href: string) {
  pushAnalyticsEvent({
    event: 'nav-link-click',
    navLinkLabel: label,
    navLinkHref: href,
  });
}

export function trackNavDropdownToggle(label: string, isOpen: boolean) {
  pushAnalyticsEvent({
    event: 'nav-dropdown-toggle',
    navDropdownLabel: label,
    navDropdownState: isOpen ? 'open' : 'closed',
  });
}

export function trackNavDropdownItemClick(
  parentLabel: string,
  label: string,
  href: string,
) {
  pushAnalyticsEvent({
    event: 'nav-dropdown-item-click',
    navDropdownParentLabel: parentLabel,
    navDropdownItemLabel: label,
    navDropdownItemHref: href,
  });
}

export function trackMobileNavToggle(isOpen: boolean) {
  pushAnalyticsEvent({
    event: 'mobile-nav-toggle',
    mobileNavState: isOpen ? 'open' : 'closed',
  });
}
