# @bdc/uswds-assets

Shared asset sync tooling for BDC apps that use USWDS.

## Why this package exists

USWDS Sass compiles runtime URLs like `/img/*` and `/fonts/*`. Those files must exist in each app's `public/` directory at build and runtime.

This package centralizes which USWDS assets BDC apps should carry and provides a repeatable sync command.

## CLI

```bash
bdc-uswds-assets-sync --project apps/site --preset site
```

Options:

- `--project`: app root that contains `public/` (default: `.`)
- `--preset`: preset name (default: `site`)

## Presets

Current preset:

- `site`: syncs curated USWDS font/image assets used by `@bdc/site`, plus the canonical `favicon.svg`

Implementation lives in `src/presets/site.mjs`.

## Favicon strategy

- Canonical source icon: `src/assets/favicon.svg`
- App target: `public/favicon.svg` (synced)
- Generated outputs: favicon files in app build output (`dist/`) via `astro-favicons`

The sync step intentionally prunes legacy `public/img/favicons` files.
