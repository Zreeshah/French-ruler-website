import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    imageAlt: z.string().optional(),
    heroImage: z.string(),
    pubDate: z.date().or(z.string().transform((val) => new Date(val))),
  }),
});

export const collections = { blog };
