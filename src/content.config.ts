import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(100),
    updated: z.coerce.date().optional(),
    // Pro llms.txt – v které sekci se má stránka uvést
    section: z.enum(['main', 'optional']).default('main'),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(100),
    icon: z.enum(['lotus', 'phone', 'envelope', 'arrow-right']).default('lotus'),
    duration: z.string().optional(),
    price: z.string().optional(),
  }),
});

const masters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/masters' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    bio: z.string(),
    order: z.number().default(100),
  }),
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: z.object({
    author: z.string(),
    location: z.string().optional(),
    date: z.coerce.date().optional(),
    order: z.number().default(100),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(100),
    category: z.string().optional(),
  }),
});

export const collections = { pages, services, masters, stories, faq };
