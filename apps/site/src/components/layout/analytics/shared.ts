export type AnalyticsElement = HTMLAnchorElement | HTMLButtonElement;

// getEventElement() normalizes the browser event target for delegated handling.
// It takes an EventTarget or null and returns an Element that can be used
// with closest(), including the parent Element when the click started on text.
export function getEventElement(target: EventTarget | null) {
  if (!(target instanceof Node)) return null;

  return target.nodeType === Node.ELEMENT_NODE
    ? (target as Element)
    : target.parentElement;
}

// getInteractiveElement() finds the interactive element for a delegated click.
// It takes an Element and returns the nearest anchor or button,
// or null when the interaction is outside those element types.
export function getInteractiveElement(target: Element) {
  const element = target.closest('a, button');

  return element instanceof HTMLAnchorElement ||
    element instanceof HTMLButtonElement
    ? element
    : null;
}

// getAnalyticsSection() finds the analytics section used for routing.
// It takes an Element and returns the nearest data-analytics-section value,
// or null when the element is not inside a tracked analytics section.
export function getAnalyticsSection(target: Element) {
  const section = target.closest<HTMLElement>('[data-analytics-section]')
    ?.dataset.analyticsSection;

  return typeof section === 'string' && section.length > 0 ? section : null;
}

// getAnalyticsEvent() finds an explicit analytics event override.
// It takes an Element and returns the nearest data-analytics-custom-event value,
// or null when no explicit event name is provided in the markup.
export function getAnalyticsEvent(target: Element) {
  const eventName = target.closest<HTMLElement>('[data-analytics-custom-event]')
    ?.dataset.analyticsCustomEvent;

  return typeof eventName === 'string' && eventName.length > 0
    ? eventName
    : null;
}

// getElementText() finds the best user-facing label for analytics.
// It takes an Element and returns the best available label from aria-label,
// image alt text, or normalized text content.
export function getElementText(target: Element) {
  const ariaLabel = target.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const imageAlt = target
    .querySelector('img[alt]')
    ?.getAttribute('alt')
    ?.trim();
  if (imageAlt) return imageAlt;

  const text = target.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text : undefined;
}
