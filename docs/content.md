# Content Authoring Guide

```md
> This document is authoritative. If implementation contradicts this guide, update the guide or refactor the code.
````

## Editable Areas

Non-developers may edit:

```

src/pages/**/*.mdx
src/content/**/*.md

```

Do NOT edit:

```

src/components/
src/layouts/
src/pages/**/*.astro

```

---

## Creating a New Page

Create:

```

src/pages/section/page-name.mdx

````

Add frontmatter:

```mdx
---
title: Page Title
layout: ../path/to/layouts/Page.astro
---
````

---

## Using Components in MDX

You may import approved components:

```mdx
import BlockLink from '@components/link/BlockLink.astro'

<BlockLink to="/docs">
  Read documentation
</BlockLink>
```

---

## What Not To Do

* Do not add Astro or React components
* Do not modify layouts
* Do not add client directives
* Do not modify routing structure

