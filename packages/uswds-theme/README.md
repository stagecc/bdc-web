# @bdc/uswds-theme

Shared USWDS design tokens and Sass configuration for BDC projects.

This package provides a single source of truth for colors, typography, and component settings so that any app in the monorepo (or external project) can adopt the BDC design system with minimal setup.

## What's included

| File | Purpose |
|---|---|
| `src/_colors.scss` | Color token overrides (primary, secondary, accent, base) |
| `src/_typography.scss` | Font families, roles, sizes, and weights |
| `src/_in-page-nav-bar.scss` | In-page navigation component settings |
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

You can then use forwarded `uswds-core` functions with the `core-` prefix:

```scss
.my-element {
  color: core.core-color('primary');
  font-family: core.core-font-family('sans');
}
```

That's it. Two lines of Sass to get the full BDC design system.

## Static assets

USWDS expects certain assets (icon sprite, fonts, images) to be served from your app's `public/` directory. Copy or symlink these from `@uswds/uswds/dist`:

- `public/img/` — USWDS images and the icon sprite (`sprite.svg`)
- `public/fonts/` — USWDS webfonts

## Examples

See the existing apps for working examples:
- **`apps/site`** — Full USWDS compilation with component styles
- **`apps/docs`** — Core-only import with Starlight CSS custom property mapping
