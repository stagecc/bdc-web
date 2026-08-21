# Analytics

This folder contains the delegated interaction helpers used by `AnalyticsController.tsx`.

The current direction splits analytics into two layers:

1. `src/layouts/Base.astro`
   - bootstraps GA4 in `<head>`
   - mounts `AnalyticsController` with `client:only="react"`
   - in the future we may consider removing React here and making this plain JavaScript

2. `src/components/layout/AnalyticsController.tsx`
   - tracks page views
   - attaches a delegated document click listener
   - routes interactions to helpers in this folder based on `data-analytics-section`

## AnalyticsController functionality

The goal is to keep `AnalyticsController` thin.

It acts as the sitewide lifecycle and routing layer, not as the place where every DOM rule, label extraction rule, and event-shaping rule lives. This folder is the current extraction point for interaction-specific logic that would otherwise make the controller harder to reason about.

On click, `AnalyticsController` currently does the following:

1. normalizes the raw browser event target into an `Element`
2. finds the nearest interactive element (`a` or `button`)
3. reads the nearest `data-analytics-section`
4. routes to a section-specific helper
5. if no section helper applies, checks for an explicit `data-analytics-custom-event` and sends that directly

Only `a` and `button` interactions are tracked in this layer right now. Clicks on non-interactive container space, such as footer whitespace, are intentionally ignored.

`AnalyticsController` listens to document click events, but only tracks interactions that resolve to supported interactive elements, currently `a` and `button`.

The current section buckets are:

- `header`
- `footer`
- `in_page_nav`

## Files

### `shared.ts`

Small DOM helpers shared by the routing layer:

- normalize delegated event targets
- find the clicked interactive element
- read analytics attributes such as:
  - `data-analytics-section`
  - `data-analytics-custom-event`
- derive a user-facing label from `aria-label`, image `alt`, or text content

### `nav.ts`

Currently holds header interaction logic.

Right now that means:

- generic header link or button click -> `header_item_click`
- header buttons with `aria-expanded` -> `header_item_expand` / `header_item_collapse`

### `footer.ts`

Currently holds footer interaction logic.

Right now that means:

- generic footer link or button click -> `footer_item_click`

### `inPageNav.ts`

Currently holds in-page navigation interaction logic.

Right now that means:

- generic in-page nav link or button click -> `in_page_nav_item_click`

## Custom Event Fallback

Some interactions should not be inferred from section and element type alone.

The current explicit attribute for those cases is:

- `data-analytics-custom-event`

The current idea is:

1. if an interaction can be handled as a shared sitewide pattern, it should probably be added to the analytics helpers in this folder
2. if the interaction is too specific to a single feature or page, it should probably use an explicit custom event in markup instead

So this attribute is currently the preferred path for custom analytics that do not belong in a shared section handler.

Example:

```html
<button
  data-analytics-custom-event="hero_cta_click"
  data-analytics-section="home_hero"
>
  Get Started
</button>
```

In that case, `AnalyticsController` can push the explicit event payload directly when no section-specific handler applies.

At the moment, section-based handlers still run first for known sections like `header`, `footer`, and `in_page_nav`. The custom event path is currently the fallback when no section-specific handler applies. That precedence is intentional in the current implementation.

## How Events Are Sent

The helpers in this folder determine what interaction happened and build the event details.

They send those events through `pushAnalyticsEvent()` in `src/util/google-analytics/pushAnalyticsEvent.ts`, which is the shared utility responsible for delivering analytics events to GA4.

## Markup Contract

Shared layout containers provide the section markers.

Current examples:

- header root: `data-analytics-section="header"`
- footer root: `data-analytics-section="footer"`
- in-page nav root: `data-analytics-section="in_page_nav"`

Section markers are intended to be routing buckets.

## Things Worth Considering

- whether the current section buckets are the right long-term abstraction
- whether the current attribute contract is clear enough for future contributors

## Next Steps

Likely next additions include:

- broader generic button tracking outside the current section handlers
- copy-to-clipboard tracking
- form tracking
- search-specific analytics

Keyboard interactions, form submissions, and other non-click interactions are not implemented in this layer yet.
