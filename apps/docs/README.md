# BDC Documentation App Overview

This app (`@bdc/docs`) is an Astro + Starlight documentation site.

Content is sourced from GitBook via the `stagecc/bdc-gitbook` repository, which is in-sync with the [BDC GitBook](https://bdcatalyst.gitbook.io/), and fetched at build time.

## Source of truth

- GitBook content repo: `https://github.com/stagecc/bdc-gitbook`
- Lock file in this repo: `apps/docs/gitbook.lock.json`
  - `repo`: Git URL to clone
  - `ref`: pinned commit SHA to sync

The lock file provides deterministic builds and deployment traceability.

## How sync works

Sync is handled by `apps/docs/scripts/sync-gitbook.mjs`.

At a high level, the script:

1. resolves source repo/ref from env vars, then lock file;
2. clones GitBook content into a temporary directory;
3. rebuilds generated docs content and assets from scratch;
4. converts GitBook markdown syntax into Starlight-compatible markdown;
5. generates sidebar config from `SUMMARY.md`; and
6. writes a sync manifest (source repo/ref/sha and counts).

Generated outputs (ignored by git):

- `apps/docs/src/content/docs/`
- `apps/docs/public/gitbook-assets/`
- `apps/docs/src/config/sidebar.generated.ts`
- `apps/docs/src/generated/gitbook-manifest.json`

## Local commands

From repo root:

- Build docs (sync first):
  - `npm run build --workspace=@bdc/docs`
- Dev server only (fast loop, no sync):
  - `npm run dev --workspace=@bdc/docs`
- Sync then run dev server:
  - `npm run dev:sync --workspace=@bdc/docs`
- Sync content only (supporting local dev):
  - `npm run sync:content --workspace=@bdc/docs`

Notes:

- The sync script requires `GITBOOK_ALLOW_OVERWRITE=1` to prevent accidental destructive writes.
- Package scripts set this automatically for normal usage.

## CI / deployment flow

Workflow: `.github/workflows/docs-gitbook-sync.yml`

- Runs on schedule and manual dispatch
- Checks latest `stagecc/bdc-gitbook` `main` commit
- Compares to `apps/docs/gitbook.lock.json`
- If changed:
  - updates lock file
  - validates docs build
  - commits lock update

Amplify listens to this repository and deploys `apps/docs` from resulting commits.

## Operational guidance

- To pin docs to a specific GitBook commit manually, update `apps/docs/gitbook.lock.json` and commit.
- To test against a different ref temporarily, set `GITBOOK_REF` when running `sync-gitbook.mjs`.
