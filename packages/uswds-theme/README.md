# @bdc/uswds-theme

Shared USWDS design tokens and Sass configuration for BDC projects.

## What this package is

A centralized collection of design decisions — colors, fonts, spacing, and layout — expressed as USWDS Sass variables and a framework-agnostic `tokens.json` file. Any team or framework can consume these values to stay aligned with the BDC design system.

## What this package does NOT do

- **Does not emit CSS.** Every file is a Sass partial or JSON. There is no compiled output.
- **Does not import USWDS.** It only defines variable values that USWDS consumers pass to `uswds-core`.
- **Does not export or wrap USWDS components.** Component usage is the consumer's responsibility.
- **Does not depend on React, Astro, or any framework.**

## Usage

### In a Sass consumer (e.g., an Astro site)

```scss
@use '@bdc/uswds-theme/src/settings' as *;

@use 'uswds-core' with (
  $theme-color-primary: $theme-color-primary,
  $theme-font-type-sans: $theme-font-type-sans
  // ...add more overrides as needed
);

@use 'uswds';
```

### In JavaScript or design tools

Import `src/tokens.json` for framework-agnostic color and font values:

```js
import tokens from '@bdc/uswds-theme/src/tokens.json';
```

## Why no component exports?

Wrapping or re-exporting USWDS components couples this package to a specific framework and version. By limiting scope to tokens and settings, this package remains safe to use across React, Astro, plain HTML, or any future framework without risk of breakage.
