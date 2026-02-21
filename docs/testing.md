# Testing

## Overview

Tests live alongside the code they exercise, and currently only the website app has tests.
The test harness uses [Vitest](https://vitest.dev) with `jsdom` for component tests and plain Node for utility/config tests.

```
src/
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
```

### Running tests

```bash
# single run
npm test -w apps/site

# watch mode
npm run test:watch -w apps/site

# browser UI
npm run test:ui -w apps/site
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
