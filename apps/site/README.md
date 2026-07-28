# @bdc/site

Astro site for the BDC project, styled with USWDS.

## Where USWDS is compiled

USWDS is compiled **only** in `src/styles/global.scss`. This file:

1. Imports shared theme settings from `@bdc/uswds-theme`
2. Configures `uswds-core` with those settings via `@use ... with (...)`
3. Imports `uswds` to emit the full CSS

This file is imported in the root layout (`src/layouts/Base.astro`), making USWDS styles available globally.

## USWDS static assets

USWDS CSS expects runtime assets under `/img` and `/fonts`. In this app, those files are synced into `public/` from shared tooling in `@bdc/uswds-assets`.

- Sync command: `npm run sync:uswds-assets`
- Automatically runs before `dev`, `build`, and `preview` via `pre*` scripts
- Source of truth for what gets synced: `packages/uswds-assets/src/presets/site.mjs`
- Canonical favicon source: `packages/uswds-assets/src/assets/favicon.svg`
- Legacy `public/img/favicons` files are pruned during sync; `astro-favicons` generates favicon outputs in the build output (`dist/`)

When adding new font weights/styles or USWDS image assets, update the shared preset, then rerun the sync command.

## Why compile only once?

USWDS outputs a large CSS bundle. Importing it in multiple files would duplicate that output, increasing bundle size and causing specificity conflicts. A single compilation point ensures consistent, predictable styling.

## How React components consume USWDS

React components use `@trussworks/react-uswds`, which provides React wrappers around USWDS markup. These components assume USWDS CSS already exists on the page. They must **never** import USWDS Sass or CSS themselves.

```tsx
import { Button } from '@trussworks/react-uswds';

export function Example() {
  return <Button type="button">Click</Button>;
}
```

Components are hydrated in Astro pages with `client:load` or other hydration directives.

## Common mistakes to avoid

- **Do not** import `uswds`, `uswds-core`, or any USWDS Sass file in components or pages.
- **Do not** add Sass `@use 'uswds'` anywhere except `global.scss`.
- **Do not** create path aliases for USWDS packages.
- **Do not** use the legacy `@import` syntax in any Sass file.

## GTM setup

Dug search interactions push analytics events to `window.dataLayer`.
To route those events to GA4, configure Google Tag Manager and set:

- `PUBLIC_GTM_ID=GTM-XXXXXXX`

in `apps/site/.env` (or your deployment environment variables).

When `PUBLIC_GTM_ID` is present, the root layout (`src/layouts/Base.astro`) injects:

- GTM bootstrap script in `<head>`
- GTM `<noscript>` iframe in `<body>`

If `PUBLIC_GTM_ID` is missing, no GTM scripts are loaded.
