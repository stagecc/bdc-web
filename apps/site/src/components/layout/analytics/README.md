# Analytics

This folder contains the delegated interaction helpers used by
`src/components/layout/AnalyticsController.tsx`, plus feature-specific
analytics helpers for interactions that are emitted directly from their owning
scripts.
This folder contains the analytics helpers used by
`src/components/layout/AnalyticsController.tsx` and by feature-specific code
that needs to send structured analytics events.

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
   - attaches delegated form listeners for `input`, `change`, and `submit`
   - routes click interactions to the helpers in this folder

### Markup Contract

The current markup contract is:

- `data-analytics-section` identifies a routing bucket
- `data-analytics-custom-event` provides an explicit event name override for
  interactions that do not belong in a shared section handler
- `data-analytics-form` marks a form for delegated analytics tracking

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

That produces an event shaped from the clicked element, including section, element type, label text, `page_path`, and `element_url` for anchor clicks.

Example tracked form markup:

```html
<form data-analytics-form="get_help">
  <input name="email" type="email" />
</form>
```

That enables delegated `form_start` and `form_submit_attempt` tracking for the form, and provides the `form_name` used by the form analytics helpers.

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

`AnalyticsController` listens to document click events, but only tracks interactions that resolve to supported interactive elements, currently `a` and `button`. Clicks on non-interactive container space, such as footer whitespace, are intentionally ignored.

For forms, `AnalyticsController` currently does the following:

1. listens to delegated `input` and `change` events
2. finds the nearest `form[data-analytics-form]`
3. emits `form_start` the first time that tracked form is interacted with
4. listens to delegated `submit` events
5. emits `form_submit_attempt` for tracked forms

The controller keeps a per-mount `Set` of started forms so repeated edits in the same form do not emit duplicate `form_start` events.

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

Known section handlers win over custom events. For example, a click inside a `data-analytics-section="header"` container will still be tracked as a header interaction even if an ancestor also provides `data-analytics-custom-event`.

### Generic Fallbacks

Outside the known section buckets:

- anchors with no explicit custom event are tracked as `link_click`
- `link_click` also includes `link_type: 'internal' | 'external'`
- buttons are not tracked unless they use `data-analytics-custom-event`

This means custom feature-specific buttons should opt in explicitly.

### Page Views

`AnalyticsController` sends a `page_view` event on mount and after Astro swaps. It deduplicates those events with `window.__bdcLastTrackedPath`, using the current pathname, search, and hash together so the same location is not tracked repeatedly.

The current `page_view` payload includes:

- `page_title`
- `page_location`
- `page_path`
- `page_search`

### Form Events

Tracked forms use `data-analytics-form` as the form name source.

Current form helpers are:

- `forms.ts`
  - `form_start`
  - `form_submit_attempt`
  - `form_submit_success`

`form_start` and `form_submit_attempt` are emitted by `AnalyticsController`'s delegated form listeners.

`form_submit_success` is emitted explicitly by form implementations that know a submission has actually completed successfully. That helper currently takes a form name directly rather than deriving it from the DOM.

### BDC-Enabled Research Interactions

The BDC-enabled research publications explorer uses the following pattern:

1. direct events for search, filter, sort, clear, and load-more interactions
2. delegated click routing through `AnalyticsController` for publication result clicks

Note: the publications explorer also writes search and filter state to query
parameters. These events provide another angle by capturing the user action and
active context.

Current event names in `bdcEnabledResearch.ts`:

- `bdc_enabled_research_search`
- `bdc_enabled_research_filter_change`
- `bdc_enabled_research_sort_change`
- `bdc_enabled_research_clear_filters`
- `bdc_enabled_research_clear_all`
- `bdc_enabled_research_load_more`

Common payload fields across the BDC-enabled research events include:

- `site_section`
- `search_term`
- `active_filter_count`
- `active_filters`
- `page_path`

For `active_filters`, the current convention is an array of stable strings such as:

```ts
['year:2024', 'researchCommunity:RECOVER', 'researchArea:Sleep']
```

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

### Search

Basic search analytics are emitted directly from the search scripts rather than
through `AnalyticsController`, because search submission is keyboard- and
form-driven rather than a pure delegated click interaction.

Current search helper:

- `search.ts`
  - `search_submit`
  - `search_result_click`

## 4. Roadmap & Open Questions

### Next Steps

Likely next additions include:

- copy-to-clipboard tracking


Keyboard interactions, form submissions, and other non-click interactions are not implemented in this layer yet.

### Things Worth Considering

- whether the current section buckets are the right long-term abstraction
- whether the current attribute contract is clear enough for future contributors
