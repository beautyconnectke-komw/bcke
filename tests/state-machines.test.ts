import { describe, expect, it } from "vitest";
import {
  canTransitionEmployerRequest,
  canTransitionHandshake,
  canTransitionWorkerAvailability,
  canTransitionWorkerVerification,
} from "../src/lib/domain/state-machines";

describe("Beauty Connect state machines", () => {
  it("allows only the intended worker verification transitions", () => {
    expect(canTransitionWorkerVerification("draft", "pending_review")).toBe(
      true,
    );
    expect(canTransitionWorkerVerification("pending_review", "approved")).toBe(
      true,
    );
    expect(canTransitionWorkerVerification("pending_review", "rejected")).toBe(
      true,
    );
    expect(canTransitionWorkerVerification("approved", "rejected")).toBe(false);
    expect(canTransitionWorkerVerification("draft", "approved")).toBe(false);
  });

  it("keeps worker availability separate and controlled", () => {
    expect(canTransitionWorkerAvailability("available", "considering")).toBe(
      true,
    );
    expect(canTransitionWorkerAvailability("considering", "available")).toBe(
      true,
    );
    expect(canTransitionWorkerAvailability("considering", "matched")).toBe(
      true,
    );
    expect(canTransitionWorkerAvailability("matched", "available")).toBe(false);
  });

  it("allows worker responses without turning every request into a handshake", () => {
    expect(canTransitionEmployerRequest("pending", "considering")).toBe(true);
    expect(canTransitionEmployerRequest("pending", "accepted")).toBe(true);
    expect(canTransitionEmployerRequest("pending", "declined")).toBe(true);
    expect(canTransitionEmployerRequest("accepted", "considering")).toBe(false);
  });

  it("keeps handshakes extensible after a match", () => {
    expect(canTransitionHandshake("matched", "completed")).toBe(true);
    expect(canTransitionHandshake("matched", "cancelled")).toBe(true);
    expect(canTransitionHandshake("completed", "matched")).toBe(false);
  });
});
