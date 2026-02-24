# Pa11y Accessibility Testing

This directory contains configuration for [pa11y](https://pa11y.org/) accessibility checks.

## Configs

- **page.json**: Single-page check. Usage: `npm run a11y:page -- http://localhost:4321/path-to/page`
- **smoke.json**: Multi-page smoke test against a predefined list of URLs.
- **full.json**: Full-site check using the sitemap.

## Hidden Elements

### `.usa-nav__primary-item button span`

The primary navigation dropdown button labels are hidden from pa11y via `hideElements`.
`axe-core` cannot reliably determine the background color for these elements due to,
i think, the sticky-positioned header's stacking context, resulting in false color-contrast
failures. The actual rendered contrast has been manually verified and meets WCAG AA requirements.

## Ignored Rules

### `frame-tested`

The `frame-tested` rule is ignored because axe-core cannot inject into cross-origin
iframes (e.g., YouTube embeds via `YouTubeEmbed.astro`). This is a tooling limitation,
not an accessibility issue. See [dequeuniversity.com/rules/axe/4.11/frame-tested](https://dequeuniversity.com/rules/axe/4.11/frame-tested).

## Dependency Override

`pa11y-ci` transitively depends on an older `minimatch` (via `globby` → `glob`)
that has a high-severity ReDoS vulnerability ([GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26)).
This is mitigated by an `overrides` entry in the root `package.json` that forces
`minimatch@>=10.2.1`. The vulnerability only applies when untrusted input is used
as a glob pattern, which is not the case here, but the override keeps `npm audit`
clean. This override can be removed once `pa11y-ci` updates its dependency chain.
