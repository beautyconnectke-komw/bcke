import { describe, expect, it } from "vitest";
import { pushCampaignSchema } from "@/lib/validations/push-campaign";

const baseCampaign = {
  title: "Hair specialists",
  body: "Discover a new Beauty Connect update.",
  target: "worker" as const,
  campaignType: "general" as const,
  audienceMode: "percentage" as const,
  audiencePercentage: 70,
  county: "Nairobi" as const,
  specialtyId: "123e4567-e89b-12d3-a456-426614174000",
  specialtyScope: "any" as const,
  promotedWorkerProfileId: null,
  workerDestination: "/worker/home" as const,
  employerDestination: null,
  startMode: "now" as const,
  startsAt: null,
  campaignPeriodDays: 7 as const,
  sendsPerRecipient: 2,
  deliveryWindowStart: "08:00",
  deliveryWindowEnd: "20:00",
  deliveryTimezone: "Africa/Nairobi",
};

describe("push campaign validation", () => {
  it("accepts structured worker audience filters and sends per recipient", () => {
    expect(pushCampaignSchema.safeParse(baseCampaign).success).toBe(true);
  });

  it("requires a selected worker for employer promotion", () => {
    const result = pushCampaignSchema.safeParse({
      ...baseCampaign,
      target: "employer",
      campaignType: "promote_worker",
      workerDestination: null,
      employerDestination: null,
    });
    expect(result.success).toBe(false);
  });

  it("does not allow worker promotion to target both roles", () => {
    const result = pushCampaignSchema.safeParse({
      ...baseCampaign,
      target: "both",
      campaignType: "promote_worker",
      promotedWorkerProfileId: "123e4567-e89b-12d3-a456-426614174001",
      workerDestination: "/worker/home",
    });
    expect(result.success).toBe(false);
  });

  it("requires a real daily delivery window", () => {
    const result = pushCampaignSchema.safeParse({
      ...baseCampaign,
      deliveryWindowStart: "20:00",
      deliveryWindowEnd: "08:00",
    });
    expect(result.success).toBe(false);
  });
});
