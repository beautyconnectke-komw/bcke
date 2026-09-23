import { z } from "zod";
import { kenyaCountySchema } from "@/lib/validations/beauty-connect";

export const pushCampaignTargetSchema = z.enum(["worker", "employer", "both"]);

export const pushCampaignTypeSchema = z.enum(["general", "promote_worker"]);

export const pushCampaignAudienceModeSchema = z.enum(["all", "percentage"]);
export const pushCampaignSpecialtyScopeSchema = z.enum([
  "any",
  "main",
  "extra",
]);

export const pushCampaignStartModeSchema = z.enum(["now", "scheduled"]);

export const pushCampaignPeriodSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(7),
  z.literal(14),
  z.literal(30),
]);

const deliveryTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.");

const workerDestinationSchema = z
  .enum(["/worker/home", "/worker/status", "/worker/profile"])
  .nullable()
  .optional()
  .default(null);

const employerDestinationSchema = z
  .enum(["/employer/home", "/employer/workers", "/employer/profile"])
  .nullable()
  .optional()
  .default(null);

export const pushCampaignAudiencePreviewSchema = z.object({
  target: pushCampaignTargetSchema,
  campaignType: pushCampaignTypeSchema,
  audienceMode: pushCampaignAudienceModeSchema,
  audiencePercentage: z.number().int().min(1).max(100),
  county: kenyaCountySchema.nullable().optional().default(null),
  specialtyId: z.uuid().nullable().optional().default(null),
  specialtyScope: pushCampaignSpecialtyScopeSchema.default("any"),
  promotedWorkerProfileId: z.uuid().nullable().optional().default(null),
});

export const pushCampaignSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(1).max(1000),
    target: pushCampaignTargetSchema,
    campaignType: pushCampaignTypeSchema,
    audienceMode: pushCampaignAudienceModeSchema,
    audiencePercentage: z.number().int().min(1).max(100).default(100),
    county: kenyaCountySchema.nullable().optional().default(null),
    specialtyId: z.uuid().nullable().optional().default(null),
    specialtyScope: pushCampaignSpecialtyScopeSchema.default("any"),
    promotedWorkerProfileId: z.uuid().nullable().optional().default(null),
    workerDestination: workerDestinationSchema,
    employerDestination: employerDestinationSchema,
    startMode: pushCampaignStartModeSchema,
    startsAt: z.string().nullable().optional().default(null),
    campaignPeriodDays: pushCampaignPeriodSchema,
    sendsPerRecipient: z.number().int().min(1).max(30),
    deliveryWindowStart: deliveryTimeSchema,
    deliveryWindowEnd: deliveryTimeSchema,
    deliveryTimezone: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .default("Africa/Nairobi"),
  })
  .superRefine((value, context) => {
    if (
      value.target === "employer" &&
      value.campaignType === "promote_worker"
    ) {
      if (!value.promotedWorkerProfileId) {
        context.addIssue({
          code: "custom",
          path: ["promotedWorkerProfileId"],
          message: "Select a worker to promote.",
        });
      }
      if (value.employerDestination) {
        context.addIssue({
          code: "custom",
          path: ["employerDestination"],
          message:
            "Promoted-worker campaigns use the worker profile destination.",
        });
      }
    } else if (value.campaignType === "promote_worker") {
      context.addIssue({
        code: "custom",
        path: ["campaignType"],
        message: "Worker promotion campaigns must target employers.",
      });
    } else if (value.promotedWorkerProfileId) {
      context.addIssue({
        code: "custom",
        path: ["promotedWorkerProfileId"],
        message:
          "A promoted worker is only used for employer promotion campaigns.",
      });
    }

    if (value.startMode === "scheduled" && !value.startsAt) {
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Choose a scheduled start time.",
      });
    }

    if (value.audienceMode === "all" && value.audiencePercentage !== 100) {
      context.addIssue({
        code: "custom",
        path: ["audiencePercentage"],
        message: "All eligible recipients must use 100 percent.",
      });
    }

    if (value.deliveryWindowStart >= value.deliveryWindowEnd) {
      context.addIssue({
        code: "custom",
        path: ["deliveryWindowEnd"],
        message: "The delivery window must end after it starts.",
      });
    }
  });

export type PushCampaignInput = z.infer<typeof pushCampaignSchema>;
export type PushCampaignAudiencePreviewInput = z.infer<
  typeof pushCampaignAudiencePreviewSchema
>;
