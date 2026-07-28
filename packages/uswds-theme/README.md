# @bdc/uswds-theme

Shared USWDS design tokens and Sass configuration for BDC projects.

This package provides a single source of truth for colors, typography, and component settings so that any app in the monorepo (or external project) can adopt the BDC design system with minimal setup.

## What's included

| File | Purpose |
|---|---|
| `src/_colors.scss` | Color token overrides (primary, secondary, accent, base) |
| `src/_typography.scss` | Font families, roles, sizes, and weights |
| `src/_in-page-nav-bar.scss` | In-page navigation component settings |
| `src/_css-vars.scss` | Optional runtime CSS variables (kept minimal; prefer USWDS tokens/utilities) |
| `src/_settings.scss` | Aggregates all settings partials |
| `src/_uswds-init.scss` | Configures and forwards `uswds-core` with all BDC settings |

## Quick start

### 1. Add dependencies

Your app needs `@bdc/uswds-theme`, `@uswds/uswds`, and a Sass compiler:

```json
{
  "dependencies": {
    "@bdc/uswds-theme": "*",
    "@uswds/uswds": "^3.13.0",
    "sass-embedded": "^1.83.0"
  }
}
```

### 2. Configure Sass load paths

USWDS resolves its internal packages via Sass `loadPaths`. Add this to your bundler config (Vite example shown):

```js
// astro.config.mjs (or vite.config.js)
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const uswdsPackages = join(rootDir, '../../node_modules/@uswds/uswds/packages');

export default {
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [uswdsPackages],
          silenceDeprecations: ['import', 'global-builtin', 'if-function'],
        },
      },
    },
  },
};
```

> Adjust the relative path to `node_modules` based on where your app lives in the monorepo.

### 3. Import in your stylesheet

**Full USWDS compilation** (includes all USWDS component styles):

```scss
@use "@bdc/uswds-theme/src/uswds-init";
@use "uswds";
```

**Core only** (tokens and utilities, no component CSS — useful for Starlight or lightweight apps):

```scss
@use "@bdc/uswds-theme/src/uswds-init" as core;
```

Avoid introducing global runtime CSS custom properties unless required by a third-party library API.

You can then use forwarded `uswds-core` functions with the `core-` prefix:

```scss
.my-element {
  color: core.core-color('primary');
  font-family: core.core-font-family('sans');
}
```

That's it. Two lines of Sass to get the full BDC design system.

## Static assets

USWDS expects certain assets (icon sprite, fonts, images) to be served from your app's `public/` directory.

In this monorepo, use `@bdc/uswds-assets` to sync curated assets instead of manually copying files.

```bash
npm run sync:uswds-assets -w @bdc/site
```

If you are integrating outside this monorepo, copy or symlink these from `@uswds/uswds/dist`:

- `public/img/` — USWDS images and the icon sprite (`sprite.svg`)
- `public/fonts/` — USWDS webfonts

## Examples

See the existing apps for working examples:
- **`apps/site`** — Full USWDS compilation with component styles
- **`apps/docs`** — Core-only import with Starlight CSS custom property mapping

## Color token strategy

Use this order when adding or changing color tokens:

1. **Prefer built-in USWDS theme tokens** when a concept already exists (`$theme-color-primary*`, `$theme-color-base*`, etc.).
2. **Add BDC semantic tokens** in `src/_colors.scss` only when USWDS does not provide the needed semantic meaning (for example: `$bdc-color-divider-soft`, `$bdc-color-meta`).
3. **Prefer no global runtime variables**. If a third-party library requires CSS custom properties, add only the minimum scoped variables needed for that integration.

### Color intent

Use shared theme colors with clear intent across all apps in the monorepo:

- **Primary (`$theme-color-primary*`)**: core brand lane for major navigation, default links, and primary actions.
- **Secondary (`$theme-color-secondary*`)**: cool supporting lane for secondary CTAs and informational emphasis.
- **Accent cool (`$theme-color-accent-cool`)**: data-forward highlights, subtle callouts, and decorative support.
- **Accent warm (`$theme-color-accent-warm`)**: selective emphasis moments, featured content cues, and promotional accents.

Keep semantic status colors (error, warning, success, info) separate from accent decisions.

### Important note on `$theme-text-color`

Treat `$theme-text-color` as a system-wide setting. It affects USWDS component internals (including button contrast logic), not just paragraph/body copy tone. Only change it if you intend to re-evaluate contrast behavior across all components and apps.
