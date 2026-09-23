import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const processDuePushCampaignDeliveries = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/push-campaign-scheduler", () => ({
  processDuePushCampaignDeliveries,
}));

import { GET } from "@/app/api/cron/push-campaigns/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("push campaign cron endpoint", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    processDuePushCampaignDeliveries.mockResolvedValue({
      claimed: 1,
      sent: 1,
      failed: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it("rejects requests without the cron header", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/push-campaigns"),
    );

    expect(response.status).toBe(401);
    expect(processDuePushCampaignDeliveries).not.toHaveBeenCalled();
  });

  it("rejects an incorrect cron header", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/push-campaigns", {
        headers: { "X-Cron-Secret": "wrong-secret" },
      }),
    );

    expect(response.status).toBe(401);
    expect(processDuePushCampaignDeliveries).not.toHaveBeenCalled();
  });

  it("accepts the configured cron header and runs the existing scheduler", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/push-campaigns", {
        headers: { "X-Cron-Secret": "test-cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      claimed: 1,
      sent: 1,
      failed: 0,
    });
    expect(processDuePushCampaignDeliveries).toHaveBeenCalledOnce();
  });

  it("rejects requests when the server secret is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(
      new Request("http://localhost/api/cron/push-campaigns", {
        headers: { "X-Cron-Secret": "test-cron-secret" },
      }),
    );

    expect(response.status).toBe(401);
    expect(processDuePushCampaignDeliveries).not.toHaveBeenCalled();
  });
});
