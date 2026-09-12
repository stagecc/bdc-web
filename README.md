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
- site/        → Public-facing website
- docs/        → Documentation site
- consortium/  → Internal consortium portal
services/
- freshdesk/  → Freshdesk API proxy (Python/Lambda)
docs/         → Developer documentation
packages/     → Shared code (future)
```

---

## Getting Started

**Dependency Management:**

- Always use `npm ci` to install dependencies locally (respects lock file exactly).
- Only use `npm install <package>` when explicitly adding or removing a dependency.
- Commit the updated `package-lock.json` after dependency changes.
- Running bare `npm install` can cause platform-specific drift in the lock file (macOS vs Ubuntu).

---

## Applications

### apps/site

Primary public-facing marketing website. Built with Astro and MDX.

Run local development server:

```bash
npm ci
npm run dev -w @bdc/site
```

Build:

```bash
npm run build -w @bdc/site
```

Preview:

```bash
npm run preview -w @bdc/site
```

### apps/docs

Documentation site. Built with Astro + [Starlight](https://starlight.astro.build/).

Run local development server:

```bash
npm ci
npm run dev -w @bdc/docs
```

Build:

```bash
npm run build -w @bdc/docs
```

Preview:

```bash
npm run preview -w @bdc/docs
```

### apps/consortium

Internal-facing portal for the BDC consortium. Surfaces the member directory, working groups, recurring meetings, BAMs (bi-annual meetings), RFCs, and other consortium resources sourced from local YAML and MDX content.

Built with Astro + MDX + USWDS as a fully static site (no SSR adapter, no server runtime). All dynamic routes (member pages, RFCs, meeting materials, BAMs) are prerendered at build time via `getStaticPaths()`.

Run local development server:

```bash
npm ci
npm run dev -w @bdc/consortium
```

Build:

```bash
npm run build -w @bdc/consortium
```

Preview:

```bash
npm run preview -w @bdc/consortium
```

---

## Services

### services/freshdesk

Source of truth for the AWS Lambda that proxies requests to the Freshdesk API. Only needed locally when developing the Lambda itself. See [services/freshdesk/README.md](services/freshdesk/README.md) for setup and usage.

---

## Architecture & Development Guidelines

All architectural rules and development standards are documented in `/docs`.

Start here:

- [Architecture Guide](docs/arch.md)
- [Component Guidelines](docs/components.md)
- [Content Authoring Guide](docs/content.md)
- [Testing & TDD Workflow](docs/testing.md)

These documents define:

- When to use Astro vs React
- How to create components
- Where content belongs
- USWDS usage rules
- Client JavaScript policies
- Test-driven development workflow

---

## Guiding Principles

- Astro-first
- MDX for pages
- USWDS-first styling
- Zero client JavaScript, unless required
- File-based routing
- Performance-focused

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

- **Lint**: Biome checks for code quality and formatting issues (results appear as inline annotations on the PR diff)
- **Build**: the app is built to catch compilation errors
- **Tests**: Vitest runs automated test suites to validate application behavior
- **Accessibility**: Playwright + axe-core audits every page against WCAG 2.0/2.1 AA (Section 508)
- **Link Check**: Lychee scans the built `site` and `consortium` HTML for broken internal links (weekly/manual runs also check external URLs)

All checks must pass before a PR can be merged.

#### Local link checks

The `links:*` scripts require the Lychee CLI to be installed and available on your `PATH`:

```bash
# macOS (Homebrew)
brew install lychee

# Linux (Ubuntu/Snap)
sudo snap install lychee

# Verify the installation
lychee --version
```

You can then check every app from the repository root:

```bash
npm run links:offline
```

To check an individual app, run the same script from its directory (for example, `apps/site`):

```bash
cd apps/site
npm run links:offline
```

Hostnames listed in `DEFAULT_IGNORED_HOSTNAMES` in `scripts/link-exclusions.mjs` are skipped by default. The link checker also resolves Bitly URLs and skips only those that redirect to a listed hostname, so new shortened meeting links require no additional configuration and other Bitly destinations are still checked. Add `--verbose` to include every link in an online check:

```bash
npm run links:online -- --verbose
```

Manual CI runs provide the same behavior through the **Include normally ignored links in external checks** option. Scheduled checks continue to apply the default hostname list.

### Before opening a PR

- Review `/docs/architecture.md`
- Confirm React is only used when necessary
- Confirm no unnecessary client hydration
- Confirm USWDS conventions are followed
