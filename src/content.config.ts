import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    year: z.union([z.string(), z.number()]),
    location: z.string(),
    typology: z.array(z.string()).default([]),
    status: z.string().optional(),
    client: z.string().optional(),
    excerpt: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(999),
    cover: z.string(),
    coverAlt: z.string(),
    sourceUrl: z.url().optional(),
    credits: z.record(z.string(), z.string()).optional(),
  }),
});

export const collections = { projects };
