# Analytics

This folder contains the delegated interaction helpers used by
`src/components/layout/AnalyticsController.tsx`.

## 1. Overview & Markup Contract

The analytics setup is currently split into two layers:

1. `src/layouts/Base.astro`
   - when `PUBLIC_GA_ID` is set, bootstraps GA4 in `<head>`
   - when `PUBLIC_GA_ID` is set, mounts `AnalyticsController` with `client:only="react"`
   - in the future we may consider removing React here and making this plain JavaScript

2. `src/components/layout/AnalyticsController.tsx`
   - tracks page views
   - listens for `astro:after-swap` so client-side navigations also emit page views
   - attaches one delegated document click listener
   - routes click interactions to the helpers in this folder

### Markup Contract

The current markup contract is:

- `data-analytics-section` identifies a routing bucket
- `data-analytics-custom-event` provides an explicit event name override for
  interactions that do not belong in a shared section handler

Current shared layout examples:

- header root: `data-analytics-section="header"`
- footer root: `data-analytics-section="footer"`
- in-page nav root: `data-analytics-section="in_page_nav"`

Example custom event markup:

```html
<button
  data-analytics-custom-event="hero_cta_click"
  data-analytics-section="home_hero"
>
  Get Started
</button>
```

That produces an event shaped from the clicked element, including section,
element type, label text, `page_path`, and `element_url` for anchor clicks.

## 2. Click Routing & Event Behavior

### AnalyticsController Responsibilities

The goal is to keep `AnalyticsController` thin.

It acts as the sitewide lifecycle and routing layer, not as the place where every DOM rule, label extraction rule, and event-shaping rule lives. This folder is the current extraction point for interaction-specific logic that would otherwise make the controller harder to reason about.

On click, `AnalyticsController` currently does the following:

1. normalizes the browser event target into an `Element`
2. finds the nearest interactive element, ie. `a` or `button`
3. reads the nearest `data-analytics-section`
4. if the section is recognized, routes to a section-specific helper
5. otherwise, if `data-analytics-custom-event` is present, pushes that custom event
6. otherwise, if the interactive element is an `a`, pushes a generic `link_click`

`AnalyticsController` listens to document click events, but only tracks
interactions that resolve to supported interactive elements, currently `a` and
`button`. Clicks on non-interactive container space, such as footer whitespace,
are intentionally ignored.

### Section Handlers

The current section buckets are:

- `header`
- `footer`
- `in_page_nav`

Their helper modules are:

- `nav.ts`
  - `header_item_click`
  - `header_item_expand`
  - `header_item_collapse`
- `footer.ts`
  - `footer_item_click`
- `inPageNav.ts`
  - `in_page_nav_item_click`

Known section handlers win over custom events. For example, a click inside a
`data-analytics-section="header"` container will still be tracked as a header
interaction even if an ancestor also provides `data-analytics-custom-event`.

### Generic Fallbacks

Outside the known section buckets:

- anchors with no explicit custom event are tracked as `link_click`
- `link_click` also includes `link_type: 'internal' | 'external'`
- buttons are not tracked unless they use `data-analytics-custom-event`

This means custom feature-specific buttons should opt in explicitly.

### Page Views

`AnalyticsController` sends a `page_view` event on mount and after Astro swaps.
It deduplicates those events with `window.__bdcLastTrackedPath`, using the
current pathname, search, and hash together so the same location is not
tracked repeatedly.

The current `page_view` payload includes:

- `page_title`
- `page_location`
- `page_path`
- `page_search`

## 3. Implementation Reference

### Shared Helpers

`shared.ts` contains the DOM helpers used by the controller and section modules:

- `getEventElement()` normalizes delegated event targets
- `getInteractiveElement()` resolves the nearest supported interactive element
- `getAnalyticsSection()` reads the nearest `data-analytics-section`
- `getAnalyticsEvent()` reads the nearest `data-analytics-custom-event`
- `getElementText()` derives a user-facing label from `aria-label`, image `alt`,
  or normalized text content

### Event Delivery

All helpers send analytics through
`src/util/google-analytics/pushAnalyticsEvent.ts`.

`pushAnalyticsEvent()` logs events to the console in development and calls
`window.gtag('event', ...)` outside development when GA is available.

## 4. Roadmap & Open Questions

### Next Steps

Likely next additions include:

- copy-to-clipboard tracking
- form tracking
- search-specific analytics

Keyboard interactions, form submissions, and other non-click interactions are not implemented in this layer yet.

### Things Worth Considering

- whether the current section buckets are the right long-term abstraction
- whether the current attribute contract is clear enough for future contributors
