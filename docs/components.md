### Suggested Structure

```md
> This document is authoritative. If implementation contradicts this guide, update the guide or refactor the code.
````

# Component Guidelines

## Default: Astro Components

Location:

```

src/components/

```

Naming:

```

PascalCase.astro

```

Use Astro components when:

- No client-side state is required
- Rendering static UI
- Wrapping USWDS classes
- Building layout structures

---

## React Components (Strictly for Interactivity)

Use React only when:

- State is required
- Effects are required
- Browser APIs are required
- Component must respond to user interaction

Location:

```

src/components/

```

---

## Component Decision Tree

Does it require interactivity?

- No → Astro component
- Yes → continue

Does USWDS provide static HTML?

- Yes → Astro component
- No → continue

Does `@trussworks/react-uswds` provide it?

- Yes → Use it
- No → Build custom React component

---

## USWDS First Policy

Before creating any component:

1. Check USWDS documentation
2. Use USWDS class utilities
3. Wrap in Astro if reused
4. Only then consider React

---

## Styling Rules

- Prefer USWDS utility classes first (`margin-*`, `padding-*`, `text-*`, `line-height-*`, `text-ls-*`, `border-*`, `shadow-*`, `display-*`, `flex-*`, `grid-*`)
- Avoid global CSS
- Scope custom styles to components
- Do not override USWDS core styles

### Utility-First Rule

Before adding custom CSS, confirm the style cannot be expressed with existing USWDS utilities.

Custom CSS is allowed only for cases utilities do not cover well, such as:

- Layered gradients or atmospheric backgrounds
- Decorative pseudo-elements and custom artwork
- Complex motion/state treatments
- Highly specialized visual compositions

If a declaration is utility-eligible, use utilities instead of custom CSS.

Common conversions:

- `letter-spacing` -> `text-ls-*`
- `line-height` -> `line-height-*`
- `box-shadow` -> `shadow-*`
- basic spacing/color/border/layout -> corresponding USWDS utility classes

PR review check:

- "Did we use USWDS utilities where available before adding custom CSS?"


This becomes your guardrail document for PR reviews.
