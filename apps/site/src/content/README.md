# BDC Public Site Content Reference

This document is the working reference for content on the BDC public site in `apps/site`.

Use it for:

- where content lives
- which routes it feeds
- what editors can safely update
- what developers need to know before changing templates or schemas

The implementation source of truth for collection schemas is `apps/site/src/content.config.ts`.
This document intentionally summarizes the model instead of duplicating every schema field.

## Scope

This README covers the BDC public site only.

- BDC Public site content reference: `apps/site/src/content/README.md`
- BDC Public site schemas: `apps/site/src/content.config.ts`
- Monorepo-level cross-app guide: `docs/content.md`

## Content Types

The BDC public site uses two broad patterns:

1. Routes in `apps/site/src/pages/**`, which include both MDX-authored pages and Astro implementation pages
2. Structured content collections in `apps/site/src/content/**`

## Page Templates

`apps/site/src/pages` contains a mix of:

- MDX content pages for one-off authored routes such as policy, landing, or explanatory pages
- Astro pages for listings, dynamic routes, and other data-driven page implementations

Current pattern for MDX pages:

- Every MDX page in `apps/site/src/pages` must include `title` and `layout` frontmatter.
- Use `Page.astro` for standard content pages.
- Use `MdxBase.astro` for pages that build their own hero, in-page navigation, and composed sections inside MDX.
- Keep routes file-based. Do not add custom route aliases in frontmatter.

Typical examples:

```mdx
---
title: Privacy Policy
layout: ../layouts/Page.astro
in_page_nav: true
---
```

```mdx
---
title: Explore BDC Data
layout: ../../../layouts/MdxBase.astro
---
```

## Quick Reference

| Type | Source | Routes | Notes |
| --- | --- | --- | --- |
| News | `src/content/news/**/index.{md,mdx}` | `/news/latest-updates/`, detail pages, tag pages | Dated folder structure |
| Events | `src/content/events/**/index.{md,mdx}` | `/news/events/`, archive, detail pages, tag pages | Dated folder structure |
| Publications | `src/content/publications.yaml` | `/news/bdc-enabled-research/` | YAML list only |
| Coverage | `src/content/coverage.yaml` | `/news/news-coverage/` | YAML list only |
| FAQs | Freshdesk via `content.config.ts` | `/help/faqs/` | No local source file |
| Programs | remote API plus `src/content/programs/*.mdx` | `/about/studies/`, detail pages | Hybrid remote + local overlay |
| Fellows | `src/content/fellows/*.md` | `/about/bdc/fellows/` | Frontmatter-driven |
| EEP | `src/content/eep/*.md` | `/about/bdc/eep/` | Body content is rendered |
| Banners | `src/content/banners/*.{md,mdx}` | global only | No direct route |

## Shared Conventions

- Collection schemas live in `apps/site/src/content.config.ts`.
- Required fields must be present even if a page appears to render without them.
- Optional fields should be omitted instead of filled with placeholder text.
- Images referenced by content entries should usually live next to the entry file.
- Prefer `YYYY-MM-DD` date values for local markdown and YAML content.
- Use MDX only when you need richer markdown behavior or component imports.

## News

- Source: `apps/site/src/content/news/**/index.{md,mdx}`
- Recommended structure: `news/YYYY/MM/slug/index.mdx`
- Route pattern: `/news/latest-updates/<entry.id>/`
- Additional route: `/tagged/<tag>/`
- Required fields: `title`, `date`
- Common optional fields: `updateType`, `tags`, `excerpt`, `heroImage`, `heroAlt`, `seo`
- Valid `updateType` values: `General Update`, `Research Highlight`, `Contributor Highlight`, `Newsletter`, `Release Notes`

How to edit:

- Create a dated folder.
- Add `index.md` or `index.mdx`.
- Add the required frontmatter.
- Add `excerpt` and tags when possible because they improve listings and search.
- Add hero images in the same folder when used.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Listing page: `apps/site/src/pages/news/latest-updates/index.astro`
- Detail page: `apps/site/src/pages/news/latest-updates/[...slug].astro`
- Layout: `apps/site/src/layouts/Article.astro`

## Events

- Source: `apps/site/src/content/events/**/index.{md,mdx}`
- Recommended structure: `events/YYYY/MM/slug/index.mdx`
- Route pattern: `/news/events/<entry.id>/`
- Additional routes: `/news/events/`, `/news/events/archive/`, `/tagged/<tag>/`
- Required fields: `title`, `date`
- Common optional fields: `time`, `display_date`, `location`, `url`, `eventType`, `registration_required`, `tags`, `materials`, `heroImage`, `heroAlt`, `seo`, `excerpt`
- Less clear fields still present in schema: `path`, `meeting_info`, `flyer`

How to edit:

- Create a dated folder.
- Add `index.md` or `index.mdx`.
- Use `url` and `registration_required` for live event registration.
- Use `end_date` for multi-day events or events that should remain upcoming through a later date.
- Add `materials` after the event when recordings, slides, or forum links are available.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Listing page: `apps/site/src/pages/news/events/index.astro`
- Archive page: `apps/site/src/pages/news/events/archive.astro`
- Detail page: `apps/site/src/pages/news/events/[...slug].astro`
- Layout: `apps/site/src/layouts/Event.astro`

## Publications

- Source: `apps/site/src/content/publications.yaml`
- Route: `/news/bdc-enabled-research/`
- Detail pages: none
- Required fields: `title`, `date`, `journalName`, `url`
- Common optional fields: `status`, `bdcContribution`, `researchArea`, `researchCommunity`

How to edit:

- Add a YAML object to `publications.yaml`.
- Keep dates parseable and preferably in `YYYY-MM-DD` format.
- Use arrays for contribution and taxonomy fields.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Listing page: `apps/site/src/pages/news/bdc-enabled-research/index.astro`

## Coverage

- Source: `apps/site/src/content/coverage.yaml`
- Route: `/news/news-coverage/`
- Detail pages: none
- Required fields: `title`, `url`, `date`, `source`
- Common optional fields: `paywall`
- Field present but currently unused by the page: `external`

How to edit:

- Add a YAML object to `coverage.yaml`.
- Use `paywall: true` when access may require login or subscription.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Listing page: `apps/site/src/pages/news/news-coverage.astro`

## FAQs

- Source: remote Freshdesk data fetched in `apps/site/src/content.config.ts`
- Route: `/help/faqs/`
- Detail pages: none
- Required fields in loaded data: `title`, `description`

How to edit:

- Do not add FAQ files under `src/content`.
- Update the corresponding FAQ entry in Freshdesk.
- Rebuild or redeploy the site so the fetched content refreshes.

Implementation references:

- Loader: `apps/site/src/content.config.ts`
- Page: `apps/site/src/pages/help/faqs.astro`

## Programs

- Sources:
  - remote program/study data from the `programs` collection
  - local overlay content in `apps/site/src/content/programs/*.mdx`
- Routes: `/about/studies/`, `/about/studies/<slug>/`
- The local filename must match the remote program slug exactly.

Remote program fields used by the site:

- `name`
- `description`
- `numberOfStudies`
- `studies[]`

Local overlay fields:

- `excerpt`
- `title`
- `priority`
- `dataAvailable`

How to edit:

- Edit or create `apps/site/src/content/programs/<program-slug>.mdx`.
- Use frontmatter to override title, excerpt, ordering, or availability.
- Put longform descriptive copy in the MDX body.
- Do not edit study counts or rows locally; they come from the remote API.

Implementation references:

- Schemas: `apps/site/src/content.config.ts`
- Merge logic: `apps/site/src/util/programs.ts`
- Listing page: `apps/site/src/pages/about/studies/index.astro`
- Detail page: `apps/site/src/pages/about/studies/[...slug].astro`

## Fellows

- Source: `apps/site/src/content/fellows/*.md`
- Route: `/about/bdc/fellows/`
- Detail pages: none
- Required fields: `name`, `university`, `photo`, `cohort`, `bio`, `project.title`, `project.abstract`
- Current rendering is frontmatter-driven; markdown body content is not used.

How to edit:

- Add or update one markdown file per fellow.
- Keep the photo in the same directory.
- Reference the photo filename in frontmatter.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Page wrapper: `apps/site/src/pages/about/bdc/fellows.mdx`
- Renderer: `apps/site/src/components/fellows/FellowsGrid.astro`

## EEP

- Source: `apps/site/src/content/eep/*.md`
- Route: `/about/bdc/eep/`
- Detail pages: none
- Required fields: `name`, `slug`, `roles`, `term_start`
- Common optional fields: `signifier`, `photo`, `adhoc`
- Unlike Fellows, EEP markdown body content is rendered on the page.

How to edit:

- Add or update one markdown file per member.
- Keep the photo in the same directory when used.
- Put profile prose in the markdown body.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Page: `apps/site/src/pages/about/bdc/eep.astro`

## Banners

- Source: `apps/site/src/content/banners/*.{md,mdx}`
- Route: none; banners render globally
- Required fields: `importance`
- Common optional fields: `variant`, `title`, `active`, `homeOnly`
- Only banners with `active: true` render.

How to edit:

- Add or update a file in `apps/site/src/content/banners/`.
- Use lower `importance` values for higher-priority banners.
- Use `homeOnly: true` only for homepage-specific alerts.
- Put the banner body in markdown or MDX content.

Implementation references:

- Schema: `apps/site/src/content.config.ts`
- Renderer: `apps/site/src/components/layout/SiteAlertList.astro`

## Open Questions And Follow-Ups

| Status | Item |
| --- | --- |
| Decision needed | Should FAQs remain entirely Freshdesk-managed, or should the repo support local FAQ authoring? |
| Decision needed | Should Programs remain a hybrid remote-plus-local model, or should more metadata move into the repo? |
| Dev task | Remove or implement the `path` field in News and Events. |
| Dev task | Remove or implement `meeting_info` and `flyer` in Events. |
| Dev task | Remove or implement `external` in Coverage. |
| Backlog | Decide whether `heroAlt` should be required whenever `heroImage` is present in News or Events. |
