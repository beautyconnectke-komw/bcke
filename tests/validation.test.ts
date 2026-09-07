import { describe, expect, it } from "vitest";
import {
  employerProfileSchema,
  requestWorkerSchema,
  respondToWorkerRequestSchema,
  workerApplicationSchema,
} from "../src/lib/validations/beauty-connect";

describe("Beauty Connect input validation", () => {
  it("normalizes worker applications with safe defaults", () => {
    const parsed = workerApplicationSchema.parse({
      fullName: "Amina Rose",
    });

    expect(parsed.yearsExperience).toBe(0);
    expect(parsed.skills).toEqual([]);
    expect(parsed.compensationModel).toBe("negotiable");
  });

  it("rejects invalid worker request responses", () => {
    expect(() =>
      respondToWorkerRequestSchema.parse({
        requestId: "00000000-0000-0000-0000-000000000000",
        response: "matched",
      }),
    ).toThrow();
  });

  it("validates employer profile coordinates", () => {
    expect(() =>
      employerProfileSchema.parse({
        businessName: "Studio Nine",
        latitude: 120,
      }),
    ).toThrow();
  });

  it("requires valid worker IDs for employer requests", () => {
    expect(() =>
      requestWorkerSchema.parse({
        workerProfileId: "not-a-uuid",
      }),
    ).toThrow();
  });
});
