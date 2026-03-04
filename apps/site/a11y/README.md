# Accessibility Testing

Automated accessibility checks using [Playwright](https://playwright.dev/) and
[axe-core](https://github.com/dequelabs/axe-core) via
[@axe-core/playwright](https://www.npmjs.com/package/@axe-core/playwright).

## Compliance Target

Our goal is [Section 508](https://www.section508.gov/) compliance. The revised Section 508
standard (2017) incorporates [WCAG 2.0 Level AA](https://www.w3.org/TR/WCAG20/) by reference,
so meeting WCAG 2.0 AA satisfies 508 requirements. Our tests use axe's `wcag2a`, `wcag2aa`,
`wcag21a`, and `wcag21aa` tag set, covering WCAG 2.0 and 2.1 at Levels A and AA.

## Usage

### Single page (against a running dev server)

```sh
npm run a11y:page -w @bdc/site -- http://localhost:4321/resources/faqs
```

Multiple URLs can be passed:

```sh
npm run a11y:page -w @bdc/site -- http://localhost:4321/about http://localhost:4321/resources/costs
```

### Smoke test (builds, then tests key pages)

```sh
npm run a11y:smoke -w @bdc/site
```

### Full site (builds, then tests every page in the sitemap)

```sh
npm run a11y:full -w @bdc/site
```

## Shared Configuration

All tests use the fixture in `axe-test.ts`, which configures axe-core with:

- **WCAG tags**: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`
- **Disabled rules**: `frame-tested` (axe cannot inject into cross-origin iframes like YouTube embeds)

The Playwright config (`../playwright.config.ts`) includes a `webServer` entry that starts
`astro preview` on port 4321. With `reuseExistingServer: true`, it reuses an already-running
server (e.g., `astro dev`) when available.

## Adding Exceptions

If a specific element triggers a false positive, you can exclude it per-test:

```ts
const results = await makeAxeBuilder()
  .exclude('.some-selector')   // exclude from all rules
  .analyze();
```

Or disable a specific rule:

```ts
const results = await makeAxeBuilder()
  .disableRules(['color-contrast'])
  .analyze();
```

See the [Playwright accessibility testing docs](https://playwright.dev/docs/accessibility-testing)
for more options including `include()`, `withRules()`, and snapshot-based approaches.
