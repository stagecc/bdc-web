import { defineCollection, z } from "astro:content";
import { readFile } from "node:fs/promises";
import { glob } from "astro/loaders";
import { load as loadYaml } from "js-yaml";

const members = defineCollection({
  loader: async () => {
    const text = await readFile("./src/content/members.yaml", "utf-8");
    const items = loadYaml(text) as Array<Record<string, unknown>>;
    return items.map((item, i) => ({ id: String(i), ...item }));
  },
  schema: z.object({
    email: z.string(),
    firstName: z.string(),
    surname: z.string(),
    team: z.string(),
    affiliation: z.string(),
    projectRole: z.string(),
  }),
});

const workingGroups = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/working-groups" }),
  schema: z.object({
    title: z.string(),
    status: z.string().default("active"),
    charter: z.string().url().optional(),
    drive: z.string().url().optional(),
    agenda: z.string().url().optional(),
  }),
});

const recurringMeetings = defineCollection({
  loader: async () => {
    const text = await readFile("./src/content/recurring-meetings.yaml", "utf-8");
    const items = loadYaml(text) as Array<Record<string, unknown>>;
    return items.map((item, i) => ({ id: String(i), ...item }));
  },
  schema: z.object({
    name: z.string(),
    schedule: z.string(),
    time: z.string(),
    agenda: z.string().url().optional(),
    notes: z.string().url().optional(),
  }),
});

const bams = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/bams" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z.string().optional(),
    notes: z.string().url().optional(),
    slides: z.string().url().optional(),
    reportout: z.string().url().optional(),
    recording: z.string().url().optional(),
  }),
});

const rfcs = defineCollection({
  loader: async () => {
    const text = await readFile("./src/content/rfcs.yaml", "utf-8");
    const items = loadYaml(text) as Array<Record<string, unknown>>;
    return items.map((item, i) => ({ id: String(i), ...item }));
  },
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    status: z.string(),
    url: z.string(),
  }),
});

const meetingMaterials = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/meeting-materials" }),
  schema: z.object({
    title: z.string(),
    parent: z.string().optional(),
    order: z.number().default(0),
    date: z.coerce.date().optional(),
    description: z.string().optional(),
    files: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          type: z.enum(["pdf", "forms", "docs", "slides", "zip"]).optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = {
  members,
  "working-groups": workingGroups,
  "recurring-meetings": recurringMeetings,
  bams,
  rfcs,
  "meeting-materials": meetingMaterials,
};
