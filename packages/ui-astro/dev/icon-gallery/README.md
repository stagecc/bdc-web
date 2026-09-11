# Icon Gallery

Local-only icon inventory for `@bdc/ui-astro`.

## Commands

From repo root:

```bash
npm run icons:gallery -w @bdc/ui-astro
```

This builds `dev/icon-gallery/dist/index.html` from:

- `src/icon/sprite.svg` (USWDS icons)
- `src/icon/custom-icons.ts` (custom icons)

Then serves the gallery at `http://localhost:4179`.

Build-only:

```bash
npm run icons:gallery:build -w @bdc/ui-astro
```
