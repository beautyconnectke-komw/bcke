import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  displayOrder: z.number().int().min(0).max(9999).default(0),
});

export const adminEmailSchema = z.object({
  email: z.email(),
});

export const featuredWorkerIdsSchema = z
  .array(z.uuid())
  .max(8)
  .refine((workerIds) => new Set(workerIds).size === workerIds.length, {
    message: "A worker can only appear once in the featured list.",
  });

export type CategoryInput = z.infer<typeof categorySchema>;
export type AdminEmailInput = z.infer<typeof adminEmailSchema>;
export type FeaturedWorkerIdsInput = z.infer<typeof featuredWorkerIdsSchema>;
