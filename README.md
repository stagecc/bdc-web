# BDC Web Platform

This repository contains the BDC web platform monorepo.

The platform is built using:

- Astro (static-first rendering)
- MDX (content pages)
- USWDS (design system)
- React (when state or interactivity required)

---

## Monorepo Structure

```
apps/
- site/     → Public-facing website
- docs/     → Documentation site (future)
docs/       → Developer documentation
packages/   → Shared code (future)

````

---

## Applications

### apps/site

Primary public-facing marketing website. Built with Astro and MDX.

Run local development server:

```bash
npm install
npm run dev -w @bdc/site
````

Build:

```bash
npm run build -w @bdc/site
```


Preview:

```bash
npm run preview -w @bdc/site
```

### apps/docs

TBD

---

## Architecture & Development Guidelines

All architectural rules and development standards are documented in `/docs`.

Start here:

* [Architecture Guide](docs/arch.md)
* [Component Guidelines](docs/components.md)
* [Content Authoring Guide](docs/content.md)

These documents define:

* When to use Astro vs React
* How to create components
* Where content belongs
* USWDS usage rules
* Client JavaScript policies

---

## Guiding Principles

* Astro-first
* MDX for pages
* USWDS-first styling
* Zero client JavaScript unless required
* File-based routing
* Performance-focused

---

## Contributing

Before opening a PR:

* Review `/docs/architecture.md`
* Confirm React is only used when necessary
* Confirm no unnecessary client hydration
* Confirm USWDS conventions are followed
