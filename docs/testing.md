# Testing

## Overview

Tests live alongside the code they exercise.
A [Vitest projects](https://vitest.dev/guide/projects) configuration at the repo root discovers each app's `vitest.config.ts`, so tests for all apps run from a single command.
The site app uses `jsdom` for component tests and plain Node for utility/config tests; the docs app uses plain Node for config tests.

```
apps/site/src/
  config/
    navigation.ts
    navigation.test.ts      <- data-driven config tests
  util/
    slugify.ts
    slugify.test.ts         <- pure unit tests
  components/
    layout/
      SearchInput.tsx
      SearchInput.test.tsx  <- React component tests

apps/docs/src/
  config/
    sidebar.ts
    sidebar.test.ts         <- sidebar structure tests
```

### Running tests

```bash
# single run (all projects)
npm test

# watch mode
npm run test:watch

# browser UI
npm run test:ui

# single project only
npx vitest run --project @bdc/site
npx vitest run --project @bdc/docs
```

---

## Test-Driven Development Workflow

Ensuring the UI stays predictable is key to its sustainability and success.
To help increase the probability of producing a stable application, we adhere to a test-driven development workflow.

### Workflow

The following steps should be followed when developing new features.

1. **Define the feature** and any associated data or interface changes.
2. **Write tests** that validate the desired behavior or data structure.

   > **Note**: These tests will fail at first. That's the point.

3. **Implement the feature** to make the tests pass.
4. **Refine**: iterate on the implementation and tests until behavior is correct and edge cases are covered.
5. **Build UI support** for any restructured data, if applicable.
6. **Validate**: run the full test suite and confirm nothing else broke.

### What to test

Not every file needs a test. Focus testing effort where it provides the most value:

- **Utility functions**: pure functions with well-defined inputs and outputs,
  _e.g._, [slugify utility](../apps/site/src/util/slugify.test.ts).
- **Configuration data**: structural invariants on config objects,
  _e.g._, [nav item structure](../apps/site/src/config/navigation.test.ts).
- **React components**: user-facing behavior: rendering, interaction, accessibility,
  _e.g._, [SearchInput interactivity](../apps/site/src/components/layout/SearchInput.test.tsx)
- **Data transforms**: any logic that reshapes content or API responses for the UI,
  _e.g._, [news/event grouping-by-tag function](../apps/site/src/util/group-by-tag.test.ts)

Avoid testing framework internals, Astro's build pipeline, or third-party library behavior.

### Conventions

- Test files are co-located with the module they test: `foo.ts` → `foo.test.ts`.
- Use `describe` / `it` blocks with human-readable descriptions.
- Prefer `@testing-library/react` for component tests: query by role, label, or text, not implementation details.
- Keep tests focused. One behavior per `it` block.

---

## Accessibility Testing

Automated accessibility audits run in CI using [Playwright](https://playwright.dev/) and [axe-core](https://github.com/dequelabs/axe-core). Every page in the built site is tested against WCAG 2.0/2.1 Level AA to satisfy [Section 508](https://www.section508.gov/) requirements.

```bash
# audit specific pages against a running dev server
npm run a11y:page -w @bdc/site -- http://localhost:4321/about

# build & test key pages
npm run a11y:smoke -w @bdc/site

# build & test every page in the sitemap
npm run a11y:full -w @bdc/site
```

See [apps/site/a11y/README.md](../apps/site/a11y/README.md) for configuration details, compliance targets, and how to add exceptions.
