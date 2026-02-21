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
- site/       → Public-facing website
- docs/       → Documentation site (future)
services/
- freshdesk/  → Freshdesk API proxy (Python/Lambda)
docs/         → Developer documentation
packages/     → Shared code (future)
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

## Services

### services/freshdesk

Source of truth for the AWS Lambda that proxies requests to the Freshdesk API. Only needed locally when developing the Lambda itself. See [services/freshdesk/README.md](services/freshdesk/README.md) for setup and usage.

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
* Zero client JavaScript, unless required
* File-based routing
* Performance-focused

---

## Contributing

### Workflow

All contributions follow a **fork-based workflow** with squash merges:

1. **Fork** this repository to your own GitHub account.
2. **Clone your fork** and create a feature branch for your work.
3. **Develop** on your fork, committing as often as you like — commit history on your branch is for your benefit during development.
4. **Open a pull request** from your fork's branch to `stagecc/bdc-web:main`.
5. **Address review feedback** — all PRs require at least one approving review before merge.
6. **Squash and merge** — once approved, the PR is merged using GitHub's _Squash and merge_ option. This collapses all commits into a single commit on `main`, keeping the project history clean and linear.

> **Why squash merge?** Each commit on `main` corresponds to exactly one PR, making history easy to read, bisect, and revert if needed.

### CI

Pull requests are automatically validated by CI, which runs:

- **Lint** — Biome checks for code quality and formatting issues (results appear as inline annotations on the PR diff)
- **Build** — the app is built to catch compilation errors

Both checks must pass before a PR can be merged.

### Before opening a PR

* Review `/docs/architecture.md`
* Confirm React is only used when necessary
* Confirm no unnecessary client hydration
* Confirm USWDS conventions are followed
