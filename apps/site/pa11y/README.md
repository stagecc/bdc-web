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
