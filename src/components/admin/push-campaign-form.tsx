"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAndActivatePushCampaignAction,
  createPushCampaignDraftAction,
  previewPushCampaignAudienceAction,
  searchPushCampaignWorkersAction,
} from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";
import { kenyaCounties } from "@/config/kenya";
import type { PushCampaignWorker } from "@/lib/domain/push-campaigns";
import type { Category } from "@/lib/domain/beauty-connect";
import type { PushCampaignInput } from "@/lib/validations/push-campaign";

type CampaignFormState = PushCampaignInput;

const defaultState: CampaignFormState = {
  title: "",
  body: "",
  target: "worker",
  campaignType: "general",
  audienceMode: "all",
  audiencePercentage: 100,
  county: null,
  specialtyId: null,
  specialtyScope: "any",
  promotedWorkerProfileId: null,
  workerDestination: null,
  employerDestination: null,
  startMode: "now",
  startsAt: null,
  campaignPeriodDays: 7,
  sendsPerRecipient: 1,
  deliveryWindowStart: "08:00",
  deliveryWindowEnd: "20:00",
  deliveryTimezone: "Africa/Nairobi",
};

function localDateTimeValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function PushCampaignForm({
  categories,
  initialWorkers,
}: {
  categories: Pick<Category, "id" | "name">[];
  initialWorkers: PushCampaignWorker[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(defaultState);
  const [workers, setWorkers] = useState(initialWorkers);
  const [workerSearch, setWorkerSearch] = useState("");
  const [preview, setPreview] = useState({
    eligible_count: 0,
    selected_count: 0,
  });
  const [previewBusy, setPreviewBusy] = useState(false);
  const [workerBusy, setWorkerBusy] = useState(false);
  const [busy, setBusy] = useState<"draft" | "activate" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedWorker = useMemo(
    () =>
      workers.find((worker) => worker.id === form.promotedWorkerProfileId) ??
      null,
    [form.promotedWorkerProfileId, workers],
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setPreviewBusy(true);
      void previewPushCampaignAudienceAction(form)
        .then((nextPreview) => {
          if (!cancelled) setPreview(nextPreview);
        })
        .catch(() => {
          if (!cancelled) setPreview({ eligible_count: 0, selected_count: 0 });
        })
        .finally(() => {
          if (!cancelled) setPreviewBusy(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [form]);

  function update<K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setMessage(null);
  }

  function changeTarget(target: CampaignFormState["target"]) {
    setForm((current) => ({
      ...current,
      target,
      campaignType: "general",
      promotedWorkerProfileId: null,
      workerDestination:
        target === "employer" ? null : current.workerDestination,
      employerDestination:
        target === "worker" ? null : current.employerDestination,
      county: null,
      specialtyId: null,
      specialtyScope: "any",
    }));
  }

  async function searchWorkers(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkerBusy(true);
    setError(null);
    try {
      setWorkers(await searchPushCampaignWorkersAction(workerSearch));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not search workers.",
      );
    } finally {
      setWorkerBusy(false);
    }
  }

  async function submit(mode: "draft" | "activate") {
    setBusy(mode);
    setError(null);
    setMessage(null);
    try {
      const payload: CampaignFormState = {
        ...form,
        startsAt:
          form.startMode === "scheduled" && form.startsAt
            ? new Date(form.startsAt).toISOString()
            : null,
      };
      const id =
        mode === "draft"
          ? await createPushCampaignDraftAction(payload)
          : await createAndActivatePushCampaignAction(payload);
      router.push(`/admin/campaigns/${id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The campaign could not be saved.",
      );
      setBusy(null);
    }
  }

  const isPromotion =
    form.target === "employer" && form.campaignType === "promote_worker";
  const audienceLabel =
    form.audienceMode === "all"
      ? "All eligible recipients"
      : `${form.audiencePercentage}% of eligible recipients`;

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-2xl border-2 border-[#035715]/20 bg-white p-5 shadow-[0_6px_20px_rgba(31,17,29,0.035)] sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#035715]">
            Step 1
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Who should receive this campaign?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a recipient role first. Audience filters and promotion
            options will adapt to it.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["worker", "employer", "both"] as const).map((target) => (
            <label
              key={target}
              className={`cursor-pointer border p-4 ${form.target === target ? "border-[#035715] bg-[#edf8ed]" : "border-border bg-background"}`}
            >
              <input
                type="radio"
                name="target"
                className="sr-only"
                checked={form.target === target}
                onChange={() => changeTarget(target)}
              />
              <span className="block font-semibold">
                {target === "worker"
                  ? "Workers"
                  : target === "employer"
                    ? "Employers"
                    : "Both"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {target === "worker"
                  ? "Reach worker users."
                  : target === "employer"
                    ? "Reach employer users."
                    : "Use role-specific destinations for both."}
              </span>
            </label>
          ))}
        </div>
        {form.target === "employer" ? (
          <label className="grid max-w-md gap-2 text-sm font-medium">
            Campaign type
            <select
              className="field"
              value={form.campaignType}
              onChange={(event) => {
                const campaignType = event.target
                  .value as CampaignFormState["campaignType"];
                setForm((current) => ({
                  ...current,
                  campaignType,
                  promotedWorkerProfileId:
                    campaignType === "general"
                      ? null
                      : current.promotedWorkerProfileId,
                  employerDestination:
                    campaignType === "promote_worker"
                      ? null
                      : current.employerDestination,
                }));
                setError(null);
                setMessage(null);
              }}
            >
              <option value="general">General campaign</option>
              <option value="promote_worker">Promote a worker</option>
            </select>
          </label>
        ) : null}
      </section>

      {isPromotion ? (
        <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Select a worker to promote
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Employers will be matched by county and exact speciality-ID
              overlap. The destination will be the selected worker&apos;s public
              profile.
            </p>
          </div>
          <form
            onSubmit={searchWorkers}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              className="field flex-1"
              value={workerSearch}
              onChange={(event) => setWorkerSearch(event.target.value)}
              placeholder="Search approved workers by name"
            />
            <Button type="submit" variant="secondary" disabled={workerBusy}>
              {workerBusy ? "Searching..." : "Search workers"}
            </Button>
          </form>
          <div className="grid gap-2">
            {workers.map((worker) => {
              const category = categories.find(
                (item) => item.id === worker.category_id,
              );
              const extras = worker.extra_specialty_ids
                .map((id) => categories.find((item) => item.id === id)?.name)
                .filter(Boolean);
              return (
                <label
                  key={worker.id}
                  className={`flex cursor-pointer items-start gap-3 border p-4 ${form.promotedWorkerProfileId === worker.id ? "border-[#035715] bg-[#edf8ed]" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="promoted-worker"
                    className="mt-1 size-4"
                    checked={form.promotedWorkerProfileId === worker.id}
                    onChange={() =>
                      update("promotedWorkerProfileId", worker.id)
                    }
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {worker.full_name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {[worker.county, category?.name, ...extras]
                        .filter(Boolean)
                        .join(" · ") || "Structured profile details incomplete"}
                    </span>
                  </span>
                </label>
              );
            })}
            {!workers.length ? (
              <p className="text-sm text-muted-foreground">
                No approved workers matched that search.
              </p>
            ) : null}
          </div>
          {selectedWorker ? (
            <p className="text-sm text-[#035715]">
              Matching data is derived from {selectedWorker.full_name}&apos;s
              current structured profile.
            </p>
          ) : null}
        </section>
      ) : null}

      {!isPromotion ? (
        <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Audience filters</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Filters use the structured county and shared speciality catalogue.
              Leave them blank to target every eligible user in the selected
              role.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              County
              <select
                className="field"
                value={form.county ?? ""}
                onChange={(event) =>
                  update(
                    "county",
                    (event.target.value || null) as CampaignFormState["county"],
                  )
                }
              >
                <option value="">All counties</option>
                {kenyaCounties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Speciality
              <select
                className="field"
                value={form.specialtyId ?? ""}
                onChange={(event) =>
                  update("specialtyId", event.target.value || null)
                }
              >
                <option value="">All specialities</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Match speciality in
              <select
                className="field"
                value={form.specialtyScope}
                onChange={(event) =>
                  update(
                    "specialtyScope",
                    event.target.value as CampaignFormState["specialtyScope"],
                  )
                }
              >
                <option value="any">Main or extra speciality</option>
                <option value="main">Main speciality only</option>
                <option value="extra">Extra speciality only</option>
              </select>
            </label>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Audience size</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Eligible means an active, appropriate profile with a recently usable
            push subscription.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Audience
            <select
              className="field"
              value={form.audienceMode}
              onChange={(event) => {
                const audienceMode = event.target
                  .value as CampaignFormState["audienceMode"];
                update("audienceMode", audienceMode);
                if (audienceMode === "all") update("audiencePercentage", 100);
              }}
            >
              <option value="all">All eligible recipients</option>
              <option value="percentage">
                Percentage of eligible recipients
              </option>
            </select>
          </label>
          {form.audienceMode === "percentage" ? (
            <label className="grid gap-2 text-sm font-medium">
              Audience percentage
              <input
                className="field"
                type="number"
                min="1"
                max="100"
                value={form.audiencePercentage}
                onChange={(event) =>
                  update("audiencePercentage", Number(event.target.value))
                }
              />
            </label>
          ) : null}
        </div>
        <div className="rounded-xl bg-[#f6f3f5] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Estimated current audience
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {previewBusy ? "..." : formatNumber(preview.selected_count)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {audienceLabel} from {formatNumber(preview.eligible_count)} eligible
            recipients.
          </p>
        </div>
      </section>

      <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Notification content</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Keep the title and message concise for browser push notifications.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className="field"
            required
            maxLength={160}
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="New Hair Specialists"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Message / body
          <textarea
            className="field min-h-28"
            required
            maxLength={1000}
            value={form.body}
            onChange={(event) => update("body", event.target.value)}
            placeholder="Discover a new opportunity on Beauty Connect."
          />
        </label>
      </section>

      <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Destination</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Only internal destinations are allowed. A promoted-worker campaign
            always opens the selected worker profile.
          </p>
        </div>
        {!isPromotion &&
        (form.target === "worker" || form.target === "both") ? (
          <label className="grid gap-2 text-sm font-medium">
            Worker destination
            <select
              className="field"
              value={form.workerDestination ?? ""}
              onChange={(event) =>
                update(
                  "workerDestination",
                  (event.target.value ||
                    null) as CampaignFormState["workerDestination"],
                )
              }
            >
              <option value="">Worker home</option>
              <option value="/worker/home">Home</option>
              <option value="/worker/status">Status</option>
              <option value="/worker/profile">Profile</option>
            </select>
          </label>
        ) : null}
        {!isPromotion &&
        (form.target === "employer" || form.target === "both") ? (
          <label className="grid gap-2 text-sm font-medium">
            Employer destination
            <select
              className="field"
              value={form.employerDestination ?? ""}
              onChange={(event) =>
                update(
                  "employerDestination",
                  (event.target.value ||
                    null) as CampaignFormState["employerDestination"],
                )
              }
            >
              <option value="">Employer home</option>
              <option value="/employer/home">Home</option>
              <option value="/employer/workers">Workers / marketplace</option>
              <option value="/employer/profile">Profile</option>
            </select>
          </label>
        ) : null}
        {isPromotion ? (
          <p className="rounded-xl bg-[#edf8ed] p-4 text-sm text-[#035715]">
            Destination: the selected worker&apos;s public profile.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 border border-border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Timing and delivery</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sends are spread across the campaign period, inside this daily
            delivery window.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 border border-border p-3 text-sm">
            <input
              type="radio"
              name="start-mode"
              checked={form.startMode === "now"}
              onChange={() => update("startMode", "now")}
            />
            Start now
          </label>
          <label className="flex items-center gap-2 border border-border p-3 text-sm">
            <input
              type="radio"
              name="start-mode"
              checked={form.startMode === "scheduled"}
              onChange={() => update("startMode", "scheduled")}
            />
            Schedule start
          </label>
        </div>
        {form.startMode === "scheduled" ? (
          <label className="grid max-w-sm gap-2 text-sm font-medium">
            Start date and time
            <input
              className="field"
              type="datetime-local"
              required
              value={
                form.startsAt ? localDateTimeValue(new Date(form.startsAt)) : ""
              }
              onChange={(event) => update("startsAt", event.target.value)}
            />
          </label>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            Campaign period
            <select
              className="field"
              value={form.campaignPeriodDays}
              onChange={(event) =>
                update(
                  "campaignPeriodDays",
                  Number(
                    event.target.value,
                  ) as CampaignFormState["campaignPeriodDays"],
                )
              }
            >
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Sends per recipient
            <input
              className="field"
              type="number"
              min="1"
              max="30"
              value={form.sendsPerRecipient}
              onChange={(event) =>
                update("sendsPerRecipient", Number(event.target.value))
              }
            />
          </label>
          <div className="rounded-xl bg-[#f6f3f5] p-3 text-xs leading-5 text-muted-foreground">
            Each selected recipient can receive this campaign up to the chosen
            number of times across the entire campaign period.
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Daily window start
            <input
              className="field"
              type="time"
              value={form.deliveryWindowStart}
              onChange={(event) =>
                update("deliveryWindowStart", event.target.value)
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Daily window end
            <input
              className="field"
              type="time"
              value={form.deliveryWindowEnd}
              onChange={(event) =>
                update("deliveryWindowEnd", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void submit("draft")}
        >
          {busy === "draft" ? "Saving..." : "Save draft"}
        </Button>
        <Button
          type="button"
          disabled={busy !== null}
          onClick={() => void submit("activate")}
        >
          {busy === "activate"
            ? "Preparing audience..."
            : form.startMode === "scheduled"
              ? "Schedule campaign"
              : "Activate campaign"}
        </Button>
      </div>
    </div>
  );
}
