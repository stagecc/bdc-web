## Amp CLI Prompt — Astro + React + USWDS (Gov Site)

You have full access to this repository’s files.

Your task is to scaffold a **new Astro + React project for a U.S. government website** using **USWDS** with a **shared, reusable design-token package**.

This project must prioritize:

* accessibility
* upgrade safety
* long-term maintainability
* cross-team reuse

Follow the instructions below **exactly**.
If a rule cannot be satisfied, stop and explain why before continuing.

---

## 1. Non-negotiable architecture

### What we are building

* An **Astro** site (primary framework)
* **React** for interactive components only
* **USWDS (Sass-based)** for styling
* A **shared internal theme package** containing:

  * design tokens (JSON)
  * USWDS Sass configuration
* No re-packaging of USWDS components

---

### What you must NOT do

❌ Do not fork USWDS
❌ Do not re-export or wrap USWDS components
❌ Do not compile USWDS more than once
❌ Do not add Sass/Vite/Astro path aliases for USWDS
❌ Do not import USWDS in React components
❌ Do not use legacy Sass `@import`

---

## 2. Repository structure (monorepo)

Create this structure exactly:

```
/packages
  /uswds-theme
    src/
      _colors.scss
      _typography.scss
      _settings.scss
      tokens.json
      index.scss
    package.json
    README.md

/apps
  /site
    src/
      components/
      layouts/
      styles/
        global.scss
    astro.config.mjs
    package.json
    README.md
```

Use npm workspaces unless the repo already uses another tool.

---

## 3. Shared package: `packages/uswds-theme`

This package **defines tokens and configuration only**.

### Purpose

* Centralize colors, fonts, spacing, and layout decisions
* Allow multiple teams and frameworks to consume the same design intent
* Avoid locking consumers into React or Astro

---

### Required files

#### `src/_colors.scss`

* Define color-related USWDS variables only
* No CSS output

#### `src/_typography.scss`

* Define font and typography USWDS variables only
* No CSS output

#### `src/_settings.scss`

* Import the partials above
* Define:

  * `$theme-color-*`
  * `$theme-font-*`
  * grid and layout variables as needed
* Do **not** import `uswds` or `uswds-core`

#### `src/tokens.json`

* Framework-agnostic design tokens
* At minimum:

  * colors
  * fonts
* Intended for use by JS, design tools, or other frameworks

#### `src/index.scss`

* Re-export settings for consumers
* No compiled CSS

---

### Package constraints (strict)

* This package must:

  * Never emit CSS
  * Never import USWDS
  * Be safe to consume by non-React apps
* Keep naming stable and boring
* Document usage clearly in README

---

## 4. Astro app: `apps/site`

### USWDS compilation rules (critical)

USWDS **must be compiled exactly once**.

It must happen only in:

```
src/styles/global.scss
```

Nowhere else.

---

### `global.scss` requirements

Import order is mandatory:

1. Shared theme settings
2. `uswds-core` with `@use ... with (...)`
3. `uswds`

Example structure (adapt values as needed):

```scss
/* 
  USWDS IS COMPILED ONLY IN THIS FILE.
  Do not import 'uswds' or 'uswds-core' anywhere else.
*/

@use '@your-org/uswds-theme/src/settings' as *;

@use 'uswds-core' with (
  $theme-color-primary: $theme-color-primary,
  $theme-font-type-sans: $theme-font-type-sans
);

@use 'uswds';
```

Do not deviate from this pattern.

---

### Astro configuration

* Import `global.scss` in the root layout
* Do not import USWDS in components or pages
* Use Astro for static rendering by default
* Hydrate React components explicitly where needed

---

## 5. React usage

### Library

* Install and configure `@trussworks/react-uswds`

### Rules

* React components must:

  * Assume USWDS CSS already exists globally
  * Never import USWDS Sass or CSS
  * Use components directly from the library

Example:

```tsx
import { Button } from '@trussworks/react-uswds';

export function Example() {
  return <Button type="button">Submit</Button>;
}
```

---

## 6. Tooling & build constraints

* Ensure Sass builds correctly with Astro
* No duplicated CSS output
* No Sass warnings related to `@use`
* No path hacks or aliases for USWDS
* Prefer clarity over cleverness

---

## 7. Documentation (required)

### `packages/uswds-theme/README.md`

Explain:

* What this package is
* What it intentionally does NOT do
* How other teams should consume it
* Why it avoids component exports

---

### `apps/site/README.md`

Explain:

* Where USWDS is compiled
* Why it must only be compiled once
* How React components consume USWDS
* Common mistakes to avoid

---

## 8. Deliverables checklist

Before finishing, verify:

* [ ] Astro app builds successfully
* [ ] USWDS CSS is included once
* [ ] Custom theme variables are applied
* [ ] React-USWDS component renders correctly
* [ ] Theme package has no CSS output
* [ ] READMEs clearly explain the architecture

---

## 9. Final instruction

Do **not** optimize prematurely.
Do **not** abstract unnecessarily.
Favor **compliance, clarity, and longevity** over convenience.
