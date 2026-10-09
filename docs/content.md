# Content Authoring Guide

> This document is authoritative. If implementation contradicts this guide, update the guide or refactor the code.

This document describes content at the monorepo level.

Use app-local documentation for app-specific content models, schemas, routes, and editorial workflows.

## Purpose

This repository contains multiple applications with different content pipelines:

- `apps/site`: the public-facing site with local MDX pages and structured Astro content collections
- `apps/docs`: the documentation site, built from synced GitBook and external-source content in a Starlight docs collection
- `apps/consortium`: the consortium portal with its own local Astro content collections backed by MDX, Markdown, and YAML

Because those apps use different content models, detailed content documentation should live with the app it describes.

## Where To Document Content

Use these locations as the primary references:

| App | Content model reference | Implementation source of truth |
| --- | --- | --- |
| `apps/site` | `apps/site/src/content/README.md` | `apps/site/src/content.config.ts` |
| `apps/docs` | `apps/docs/README.md` and sync docs under `apps/docs/sync-sources/README.md` | `apps/docs/src/content.config.ts`, sync scripts, and lock files |
| `apps/consortium` | Add or maintain app-local docs as needed near the app | `apps/consortium/src/content.config.ts` |

## App Summaries

### `apps/site`

The BDC public site mixes two patterns:

- routes in `apps/site/src/pages/**`, which include both MDX-authored pages and Astro implementation pages
- structured collections in `apps/site/src/content/**`

That content model is specific to the public site and is documented in `apps/site/src/content/README.md`.

### `apps/docs`

The docs app is not primarily hand-authored local content. It is a Starlight site whose `docs` collection is loaded through Starlight's docs loader, with content generated at build time from:

- GitBook sync
- external source sync

Relevant references:

- `apps/docs/README.md`
- `apps/docs/sync-sources/README.md`
- `apps/docs/src/content.config.ts`

### `apps/consortium`

The consortium app has its own structured Astro content collections, including members, working groups, recurring meetings, BAMs, RFCs, and meeting materials.

Its implementation source of truth is:

- `apps/consortium/src/content.config.ts`

Its content lives under:

- `apps/consortium/src/content/**`

## General Rules

- Keep app-specific content guidance inside the app whenever the content model is app-specific.
- Keep repo-level documentation in `docs/` focused on shared rules and cross-app orientation.
- When content schemas change, update both the implementation source of truth and the app-local reference doc.
- Do not assume one app's authoring model applies to another app.

## Current Canonical References

- Public site content model: `apps/site/src/content/README.md`
- Public site schema definitions: `apps/site/src/content.config.ts`
- Docs app content pipeline: `apps/docs/README.md`
- Docs external sync flow: `apps/docs/sync-sources/README.md`
- Consortium app schema definitions: `apps/consortium/src/content.config.ts`
