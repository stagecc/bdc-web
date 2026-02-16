import { defineCollection, z } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { glob } from 'astro/loaders';
import { load as loadYaml } from 'js-yaml';

const news = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          keywords: z.array(z.string()).optional(),
        })
        .optional(),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      externalEvent: z.boolean().optional(),
      path: z.string().optional(),
      date: z.coerce.date(),
      end_date: z.coerce.date().optional(),
      time: z.string().optional(),
      display_date: z.string().optional(),
      location: z.string().optional(),
      url: z.string().optional(),
      forum_post: z.string().optional(),
      meeting_info: z.record(z.string(), z.string()).optional(),
      registration_required: z.boolean().optional(),
      flyer: z.string().optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().nullable().optional(),
          keywords: z.array(z.string()).optional(),
        })
        .optional(),
    }),
});

const publications = defineCollection({
  loader: async () => {
    const text = await readFile('./src/content/publications.yaml', 'utf-8');
    const items = loadYaml(text) as Array<Record<string, unknown>>;
    return items.map((item, i) => ({ id: String(i), ...item }));
  },
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z.string(),
    url: z.string(),
  }),
});

const coverage = defineCollection({
  loader: async () => {
    const text = await readFile('./src/content/coverage.yaml', 'utf-8');
    const items = loadYaml(text) as Array<Record<string, unknown>>;
    return items.map((item, i) => ({ id: String(i), ...item }));
  },
  schema: z.object({
    title: z.string(),
    url: z.string(),
    date: z.coerce.date(),
    source: z.string(),
    external: z.boolean().optional(),
    paywall: z.boolean().optional(),
  }),
});

const faqs = defineCollection({
  loader: async () => {
    const response = await fetch(
      'https://epxuifil2cc4sqfqws62zejcwi0cgfds.lambda-url.us-east-1.on.aws/faqs',
      {
        headers: {
          Accept: 'application/json',
          Origin: 'https://biodatacatalyst.nhlbi.nih.gov',
        },
      },
    );
    const data = await response.json();
    return data
      .filter((article: Record<string, unknown>) => article.status === 2)
      .map((article: Record<string, unknown>) => ({
        id: String(article.id),
        title: String(article.title),
        description: String(article.description),
      }));
  },
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const slugify = function slug(name: string): string {
  const acronymMatch = name.match(/\(([^)]+)\)/);
  const base = acronymMatch ? acronymMatch[1] : name;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const programs = defineCollection({
  loader: async () => {
    const listResponse = await fetch(
      'https://search.biodatacatalyst.renci.org/search-api/program_list',
      { headers: { Accept: 'application/json' } },
    );
    const listData = await listResponse.json();
    const programs = await Promise.all(
      listData.result.map(async (program: Record<string, unknown>) => {
        const studiesResponse = await fetch(
          `https://search.biodatacatalyst.renci.org/search-api/search_program?program_name=${encodeURIComponent(String(program.key))}`,
          { headers: { Accept: 'application/json' } },
        );
        const studiesData = await studiesResponse.json();
        const name = String(program.key);
        return {
          id: slugify(name),
          name,
          description: String(program.description),
          numberOfStudies: (program.No_of_studies as { value: number }).value,
          studies: studiesData.result.map(
            (s: Record<string, unknown>) => ({
              name: String(s.collection_name),
              id: String(s.collection_id),
              url: String(s.collection_action),
            }),
          ),
        };
      }),
    );
    return programs;
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    numberOfStudies: z.number(),
    studies: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
        url: z.string(),
      }),
    ),
  }),
});

export const collections = {
  news,
  events,
  publications,
  coverage,
  faqs,
  programs,
};
