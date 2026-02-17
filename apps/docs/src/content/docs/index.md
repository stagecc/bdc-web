---
title: Welcome to BDC Documentation
description: Get started building your docs site with Starlight.
template: splash
hero:
  tagline: Congrats on setting up a new Starlight project!
  image:
    file: ../../assets/favicon.svg
  actions:
    - text: Example Guide
      link: /guides/example/
      icon: right-arrow
    - text: Read the Starlight docs
      link: https://starlight.astro.build
      icon: external
      variant: minimal
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Next steps

<CardGrid stagger>
	<Card title="Update content" icon="pencil">
		Edit `src/content/docs/index.md` to change this page.
	</Card>
	<Card title="Add new content" icon="add-document">
		Add Markdown or MDX files to `src/content/docs` to create new pages.
	</Card>
	<Card title="Configure your site" icon="setting">
		Edit your `sidebar` and other config in `astro.config.mjs`.
	</Card>
	<Card title="Read the docs" icon="open-book">
		Learn more in [the Starlight Docs](https://starlight.astro.build/).
	</Card>
</CardGrid>
