# BDC Web Platform — Architecture

```md
> This document is authoritative. If implementation contradicts this guide, update the guide or refactor the code.
````

## Core Principles

1. Astro is the default rendering system
2. MDX is the default page format
3. USWDS is the default design system
4. We ship zero client-side JavaScript unless required
5. React is used only for interactivity
6. Content must be editable by non-developers when possible
7. Routing must remain file-based
8. Performance is a primary architectural concern

---

## Rendering Hierarchy

When building UI components, follow this order:

- Native HTML + USWDS classes
- Astro component
- React USWDS component (`@trussworks/react-uswds`)
- Custom React component

---

## File Type Rules

### Use `.mdx` for Pages (Default)

All static pages live in:

```src/pages/**/*.mdx```


### Use `.astro` for:

- Layouts
- Dynamic routes
- Pages requiring server logic

### Use `src/content` ONLY for structured collections

Allowed collections:
- news
- events
- publications


Static pages do NOT belong in `src/content`.

---

## Client JavaScript Rules

Default: no hydration.

Allowed directives:

- `client:visible` (preferred)
- `client:idle`
- `client:media`

Avoid `client:load` unless justified.

---

## Absolute Anti-Patterns

- React for static UI
- Wrapper pages for MDX
- Using collections for static pages
- Global overrides of USWDS
- Building custom React components when USWDS already provides one

---

## Golden Rule

If it can be built with Markdown, MDX, Astro, and USWDS — it must be.
