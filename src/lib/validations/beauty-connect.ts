import { z } from "zod";

export const uuidSchema = z.uuid();

export const profileRoleSchema = z.enum(["worker", "employer", "admin"]);

export const compensationModelSchema = z.enum([
  "salary",
  "commission",
  "salary_plus_commission",
  "hourly",
  "negotiable",
]);

export const workerRequestResponseSchema = z.enum([
  "accepted",
  "considering",
  "declined",
]);

export const workerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  county: z.string().trim().max(80).nullable().optional(),
  town: z.string().trim().max(120).nullable().optional(),
  categoryId: uuidSchema.nullable().optional(),
  profilePhotoPath: z.string().trim().max(500).nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80).default(0),
  experienceMonths: z.number().int().min(0).max(11).default(0),
  shortBio: z.string().trim().max(600).nullable().optional(),
  workExperience: z.string().trim().max(5000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  extraSpecialtyIds: z.array(uuidSchema).max(12).default([]),
  compensationModel: compensationModelSchema.default("negotiable"),
  salaryExpectation: z.number().nonnegative().nullable().optional(),
  commissionExpectation: z.number().min(0).max(100).nullable().optional(),
});

export const workerApplicationSubmissionSchema = workerApplicationSchema.extend(
  {
    county: z.string().trim().min(2).max(80),
    town: z.string().trim().min(2).max(120),
    categoryId: uuidSchema,
  },
);

export const updateWorkerProfileSchema = workerApplicationSchema
  .partial()
  .omit({ compensationModel: true })
  .extend({
    compensationModel: compensationModelSchema.optional(),
  });

export const workerContactProfileSchema = z.object({
  phone: z.string().trim().max(40).nullable().optional(),
  county: z.string().trim().max(80).nullable().optional(),
  town: z.string().trim().max(120).nullable().optional(),
  shortBio: z.string().trim().max(600).nullable().optional(),
});

export const workerReviewedProfileSchema = z.object({
  categoryId: uuidSchema,
  profilePhotoPath: z.string().trim().max(500).nullable().optional(),
  extraSpecialtyIds: z.array(uuidSchema).max(12).default([]),
  portfolioPaths: z.array(z.string().trim().max(500)).max(4).default([]),
});

export const employerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().max(160).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  businessEmail: z.email().nullable().optional(),
  description: z.string().trim().max(1200).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  addressLine: z.string().trim().max(240).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  profileImagePath: z.string().trim().max(500).nullable().optional(),
  salonInfo: z.record(z.string(), z.unknown()).default({}),
});

export const requestWorkerSchema = z.object({
  workerProfileId: uuidSchema,
  message: z.string().trim().max(2000).nullable().optional(),
});

export const respondToWorkerRequestSchema = z.object({
  requestId: uuidSchema,
  response: workerRequestResponseSchema,
});

export const adminWorkerDecisionSchema = z.object({
  workerProfileId: uuidSchema,
  reason: z.string().trim().max(1000).nullable().optional(),
});

export const adminEmployerDecisionSchema = z.object({
  employerProfileId: uuidSchema,
  reason: z.string().trim().max(1000).nullable().optional(),
});

export const marketplaceFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: uuidSchema.optional(),
  availability: z.enum(["available", "considering", "matched"]).optional(),
  minimumYearsExperience: z.number().int().min(0).max(80).optional(),
});

export const notificationIdSchema = z.object({
  notificationId: uuidSchema,
});

export type WorkerApplicationInput = z.infer<typeof workerApplicationSchema>;
export type WorkerApplicationSubmissionInput = z.infer<
  typeof workerApplicationSubmissionSchema
>;
export type UpdateWorkerProfileInput = z.infer<
  typeof updateWorkerProfileSchema
>;
export type WorkerContactProfileInput = z.infer<
  typeof workerContactProfileSchema
>;
export type WorkerReviewedProfileInput = z.infer<
  typeof workerReviewedProfileSchema
>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type RequestWorkerInput = z.infer<typeof requestWorkerSchema>;
export type RespondToWorkerRequestInput = z.infer<
  typeof respondToWorkerRequestSchema
>;
export type AdminWorkerDecisionInput = z.infer<
  typeof adminWorkerDecisionSchema
>;
export type AdminEmployerDecisionInput = z.infer<
  typeof adminEmployerDecisionSchema
>;
export type MarketplaceFiltersInput = z.infer<typeof marketplaceFiltersSchema>;
