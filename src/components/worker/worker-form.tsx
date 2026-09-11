"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  createWorkerApplicationAction,
  saveWorkerDraftAction,
  submitWorkerReviewedProfileAction,
  updateWorkerProfileAction,
} from "@/app/actions/beauty-connect";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import { kenyaCounties } from "@/config/kenya";
import {
  workerApplicationSchema,
  workerApplicationSubmissionSchema,
  type WorkerApplicationInput,
  type WorkerApplicationSubmissionInput,
} from "@/lib/validations/beauty-connect";
import type { Category } from "@/lib/domain/beauty-connect";
import type { Tables } from "@/types/database";
import { calculateExperience, publicImageUrl } from "@/lib/utils";
import { Button } from "@/components/shared/ui";

type FormValues = {
  fullName: string;
  phone: string;
  county: string;
  town: string;
  categoryId: string;
  profilePhotoPath: string | null;
  yearsExperience: number;
  experienceMonths: number;
  shortBio: string;
  extraSpecialtyIds: string[];
  compensationModel: WorkerApplicationInput["compensationModel"];
  salaryExpectation: number | null;
  commissionExpectation: number | null;
};

type PreviewFile = { file: File; url: string };

export function WorkerForm({
  profile,
  categories,
  submittedPortfolio = [],
  mode,
}: {
  profile: Tables<"worker_profiles"> | null;
  categories: Category[];
  submittedPortfolio?: Tables<"worker_portfolio">[];
  mode: "onboarding" | "edit";
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    publicImageUrl(
      env.supabase.url,
      "worker-profile-images",
      profile?.profile_photo_path,
    ),
  );
  const [portfolio, setPortfolio] = useState<PreviewFile[]>([]);
  const [busy, setBusy] = useState<"draft" | "submit" | "reviewed" | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const { register, handleSubmit, control, setValue } = useForm<FormValues>({
    defaultValues: {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      county: profile?.county ?? "",
      town: profile?.town ?? "",
      categoryId: profile?.category_id ?? "",
      profilePhotoPath: profile?.profile_photo_path ?? null,
      yearsExperience: profile?.years_experience ?? 0,
      experienceMonths: profile?.experience_months ?? 0,
      shortBio: profile?.short_bio ?? "",
      extraSpecialtyIds: profile?.extra_specialty_ids ?? [],
      compensationModel: profile?.compensation_model ?? "negotiable",
      salaryExpectation: profile?.salary_expectation ?? null,
      commissionExpectation: profile?.commission_expectation ?? null,
    },
  });
  const compensationModel = useWatch({ control, name: "compensationModel" });
  const mainSpecialtyId = useWatch({ control, name: "categoryId" });
  const selectedExtraSpecialtyIds =
    useWatch({ control, name: "extraSpecialtyIds" }) ?? [];
  const categoryField = register("categoryId");
  const extraCategories = categories.filter(
    (category) => category.id !== mainSpecialtyId,
  );
  const showsSalary =
    compensationModel === "salary" ||
    compensationModel === "salary_plus_commission" ||
    compensationModel === "hourly";
  const showsCommission =
    compensationModel === "commission" ||
    compensationModel === "salary_plus_commission";

  async function upload(
    file: File,
    bucket: string,
    userId: string,
    prefix: string,
  ) {
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${extension}`;
    const { error } = await createClient()
      .storage.from(bucket)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  function selectPhoto(file: File | null) {
    setPhoto(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function selectPortfolio(files: FileList | null) {
    const capacity =
      mode === "edit" ? 4 : Math.max(0, 4 - submittedPortfolio.length);
    const selected = Array.from(files ?? []).slice(0, capacity);
    setPortfolio((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return selected.map((file) => ({ file, url: URL.createObjectURL(file) }));
    });
  }

  function removePortfolio(index: number) {
    setPortfolio((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function submit(
    values: FormValues,
    intent: "draft" | "submit" | "reviewed",
  ) {
    setBusy(intent);
    setFeedback(null);
    try {
      const client = createClient();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user)
        throw new Error("Your session has expired. Please log in again.");
      const profilePhotoPath =
        (mode === "onboarding" || intent === "reviewed") && photo
          ? await upload(photo, "worker-profile-images", user.id, "profile")
          : values.profilePhotoPath;
      const salaryExpectation = [
        "salary",
        "salary_plus_commission",
        "hourly",
      ].includes(values.compensationModel)
        ? values.salaryExpectation
        : null;
      const commissionExpectation = [
        "commission",
        "salary_plus_commission",
      ].includes(values.compensationModel)
        ? values.commissionExpectation
        : null;
      const base = {
        ...values,
        profilePhotoPath,
        categoryId: values.categoryId || null,
        phone: values.phone || null,
        county: values.county || null,
        town: values.town || null,
        location: values.town || values.county || null,
        shortBio: values.shortBio || null,
        workExperience: null,
        skills: [],
        extraSpecialtyIds: (values.extraSpecialtyIds ?? []).filter(
          (specialtyId) => specialtyId !== values.categoryId,
        ),
        salaryExpectation,
        commissionExpectation,
      };

      let workerId: string | null = null;
      if (mode === "edit") {
        if (intent === "reviewed") {
          const portfolioPaths = await uploadPortfolioFiles(user.id);
          workerId = await submitWorkerReviewedProfileAction({
            categoryId: values.categoryId,
            profilePhotoPath,
            extraSpecialtyIds: (values.extraSpecialtyIds ?? []).filter(
              (specialtyId) => specialtyId !== values.categoryId,
            ),
            portfolioPaths,
          });
        } else {
          const updated = await updateWorkerProfileAction({
            phone: values.phone || null,
            county: values.county || null,
            town: values.town || null,
            shortBio: values.shortBio || null,
          });
          workerId = updated?.id ?? null;
        }
      } else if (intent === "draft") {
        const parsed = workerApplicationSchema.parse(base);
        workerId = (await saveWorkerDraftAction(parsed))?.id ?? null;
      } else {
        const parsed: WorkerApplicationSubmissionInput =
          workerApplicationSubmissionSchema.parse(base);
        const portfolioPaths = await uploadPortfolioFiles(user.id);
        workerId = await createWorkerApplicationAction(parsed, portfolioPaths);
      }
      if (!workerId)
        throw new Error("We could not create your worker profile.");

      if (mode === "onboarding" && intent === "draft") {
        const portfolioPaths = await uploadPortfolioFiles(user.id);
        await savePortfolioRecords(client, workerId, portfolioPaths);
      }
      setFeedback(
        intent === "reviewed"
          ? "Changes submitted for admin review."
          : mode === "edit"
            ? "Profile updated."
            : intent === "draft"
              ? "Draft saved. Your role is not locked yet."
              : "Application submitted for review. Your Worker role is now locked.",
      );
      if (intent === "submit" || intent === "reviewed" || mode === "edit") {
        router.push(
          mode === "edit" && intent !== "reviewed"
            ? "/worker/profile"
            : "/worker/status",
        );
        router.refresh();
      }
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "We could not save your profile.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function uploadPortfolioFiles(userId: string) {
    const paths: string[] = [];
    for (const [index, item] of portfolio.entries()) {
      paths.push(
        await upload(
          item.file,
          "worker-portfolio-images",
          userId,
          `portfolio-${index + 1}`,
        ),
      );
    }
    return paths;
  }

  async function savePortfolioRecords(
    client: ReturnType<typeof createClient>,
    workerId: string,
    paths: string[],
  ) {
    const nextDisplayOrder =
      Math.max(0, ...submittedPortfolio.map((item) => item.display_order)) + 1;
    for (const [index, path] of paths.entries()) {
      const { error } = await client.from("worker_portfolio").insert({
        worker_profile_id: workerId,
        storage_path: path,
        display_order: nextDisplayOrder + index,
      });
      if (error) throw error;
    }
  }

  if (mode === "edit" && profile) {
    return (
      <form
        onSubmit={handleSubmit((values) => submit(values, "submit"))}
        className="grid min-w-0 gap-6"
      >
        <section className="flex items-center gap-4 border border-border p-4 sm:p-6">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden bg-muted sm:size-28">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="size-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-muted-foreground">
                No image
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Worker profile
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold">
              {profile.full_name}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {[profile.town, profile.county].filter(Boolean).join(", ") ||
                "Location not added"}
            </p>
          </div>
        </section>

        <section className="grid gap-5 border border-border p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Edit profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update only the personal details that do not need moderation.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone number">
              <input
                {...register("phone")}
                className="field"
                placeholder="+254 ..."
              />
            </Field>
            <Field label="County">
              <select {...register("county")} className="field">
                <option value="">Choose your county</option>
                {kenyaCounties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Town">
            <input
              {...register("town")}
              className="field"
              placeholder="Your town"
            />
          </Field>
          <Field label="Bio">
            <textarea
              {...register("shortBio")}
              className="field min-h-28 py-3"
              placeholder="Tell employers what you do best."
            />
          </Field>
        </section>

        <section className="grid gap-5 border border-border p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Professional record</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These details are locked after submission and can only be changed
              through admin review.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyValue
              label="Experience"
              value={formatExperience(profile)}
            />
            <ReadOnlyValue
              label="Main speciality"
              value={
                categories.find(
                  (category) => category.id === profile.category_id,
                )?.name ?? "Not listed"
              }
            />
          </div>
          <div>
            <p className="text-sm font-medium">Extra specialities</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.extra_specialty_ids.length ? (
                profile.extra_specialty_ids.map((id) => (
                  <span
                    key={id}
                    className="border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {categories.find((category) => category.id === id)?.name ??
                      "Speciality"}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No extra specialities listed.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Portfolio</p>
            {submittedPortfolio.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {submittedPortfolio.map((item) => {
                  const image = publicImageUrl(
                    env.supabase.url,
                    item.storage_bucket,
                    item.storage_path,
                  );
                  return image ? (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={item.alt_text || "Portfolio example"}
                        fill
                        sizes="(min-width: 1024px) 220px, (min-width: 640px) 25vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No portfolio images submitted.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-5 border border-border p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Request professional changes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Profile image, portfolio, and specialities require admin review
              before they become public.
            </p>
          </div>
          <Field label="Profile image">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)}
              className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
            />
          </Field>
          <Field label="Main speciality">
            <select
              {...categoryField}
              onChange={(event) => {
                categoryField.onChange(event);
                setValue(
                  "extraSpecialtyIds",
                  selectedExtraSpecialtyIds.filter(
                    (specialtyId) => specialtyId !== event.target.value,
                  ),
                );
              }}
              className="field"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Extra specialities"
            hint="Selecting new portfolio images replaces the current portfolio after approval."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {extraCategories.map((category) => {
                const isSelected = selectedExtraSpecialtyIds.includes(
                  category.id,
                );
                const reachedLimit =
                  selectedExtraSpecialtyIds.length >= 12 && !isSelected;
                return (
                  <label
                    key={category.id}
                    className={`flex min-h-12 items-center gap-3 border px-3 py-3 text-sm transition ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground"
                    } ${reachedLimit ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      value={category.id}
                      {...register("extraSpecialtyIds")}
                      disabled={reachedLimit}
                      className="size-4 accent-current"
                    />
                    <span>{category.name}</span>
                  </label>
                );
              })}
            </div>
          </Field>
          <Field label="Replace portfolio images">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => selectPortfolio(event.target.files)}
              className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
            />
          </Field>
          {portfolio.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {portfolio.map((item, index) => (
                <div key={item.url} className="relative">
                  <img
                    src={item.url}
                    alt={`New portfolio preview ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolio(index)}
                    className="absolute right-1 top-1 bg-foreground px-2 py-1 text-xs text-background"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {feedback ? (
          <p className="text-sm text-muted-foreground">{feedback}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy !== null}>
            {busy === "submit" ? "Saving..." : "Save personal details"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={
              busy !== null || profile.verification_status !== "approved"
            }
            onClick={handleSubmit((values) => submit(values, "reviewed"))}
          >
            {busy === "reviewed" ? "Submitting..." : "Submit for admin review"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => submit(values, "submit"))}
      className="grid min-w-0 gap-8"
    >
      <section className="grid gap-5 border-b border-border pb-8">
        <div>
          <h2 className="text-lg font-semibold">Your profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with the details employers need to understand your work.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              required
              {...register("fullName")}
              className="field"
              placeholder="Your name"
            />
          </Field>
          <Field label="Phone number">
            <input
              {...register("phone")}
              className="field"
              placeholder="+254 ..."
            />
          </Field>
          <Field label="County">
            <select {...register("county")} className="field">
              <option value="">Choose your county</option>
              {kenyaCounties.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Town">
            <input
              {...register("town")}
              className="field"
              placeholder="Your town"
            />
          </Field>
          <Field label="Main speciality">
            <select
              {...categoryField}
              onChange={(event) => {
                categoryField.onChange(event);
                setValue(
                  "extraSpecialtyIds",
                  selectedExtraSpecialtyIds.filter(
                    (specialtyId) => specialtyId !== event.target.value,
                  ),
                );
              }}
              className="field"
            >
              <option value="">Choose a speciality</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Profile image">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)}
              className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="mt-2 size-24 rounded-md object-cover"
              />
            ) : null}
          </Field>
        </div>
      </section>
      <section className="grid gap-5 border-b border-border pb-8">
        <div>
          <h2 className="text-lg font-semibold">Your experience</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one main speciality, then add any other specialities you
            offer.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Years of experience">
            <input
              type="number"
              min="0"
              max="80"
              {...register("yearsExperience", { valueAsNumber: true })}
              className="field"
            />
          </Field>
          <Field label="Additional months">
            <select
              {...register("experienceMonths", { valueAsNumber: true })}
              className="field"
            >
              {Array.from({ length: 12 }, (_, month) => (
                <option key={month} value={month}>
                  {month} month{month === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Extra specialities"
          hint="Tap each speciality you offer. Your main speciality is excluded."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {extraCategories.map((category) => {
              const isSelected = selectedExtraSpecialtyIds.includes(
                category.id,
              );
              const reachedLimit =
                selectedExtraSpecialtyIds.length >= 12 && !isSelected;
              return (
                <label
                  key={category.id}
                  className={`flex min-h-12 items-center gap-3 border px-3 py-3 text-sm transition ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:border-foreground"
                  } ${reachedLimit ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    value={category.id}
                    {...register("extraSpecialtyIds")}
                    disabled={reachedLimit}
                    className="size-4 accent-current"
                  />
                  <span>{category.name}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedExtraSpecialtyIds.length} of 12 extra specialities
            selected.
          </p>
        </Field>
        <Field label="Short bio">
          <textarea
            {...register("shortBio")}
            className="field min-h-28 py-3"
            placeholder="Tell employers what you do best."
          />
        </Field>
      </section>
      <section className="grid gap-5 border-b border-border pb-8">
        <div>
          <h2 className="text-lg font-semibold">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a preference and share only the payment details that apply.
          </p>
        </div>
        <Field label="Payment preference">
          <select {...register("compensationModel")} className="field">
            <option value="negotiable">Negotiable</option>
            <option value="salary">Salary</option>
            <option value="commission">Commission only</option>
            <option value="salary_plus_commission">Salary + commission</option>
            <option value="hourly">Hourly</option>
          </select>
        </Field>
        {showsSalary ? (
          <Field
            label={
              compensationModel === "hourly" ? "Hourly amount" : "Salary amount"
            }
          >
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("salaryExpectation", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
              className="field"
              placeholder="Amount"
            />
          </Field>
        ) : null}
        {showsCommission ? (
          <Field label="Commission percentage">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...register("commissionExpectation", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
              className="field"
              placeholder="Percentage"
            />
          </Field>
        ) : null}
      </section>
      <section className="grid gap-5">
        <div>
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose up to four examples. You can preview and remove them before
            saving.
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => selectPortfolio(event.target.files)}
          className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
        />
        {portfolio.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {portfolio.map((item, index) => (
              <div key={item.url} className="relative">
                <img
                  src={item.url}
                  alt={`Portfolio preview ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePortfolio(index)}
                  className="absolute right-1 top-1 rounded-md bg-foreground px-2 py-1 text-xs text-background"
                  title="Remove image"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No portfolio images selected yet.
          </p>
        )}
      </section>
      {feedback ? (
        <p className="text-sm text-muted-foreground">{feedback}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null || mode === "edit"}
          onClick={handleSubmit((values) => submit(values, "draft"))}
        >
          {busy === "draft" ? "Saving..." : "Save draft"}
        </Button>
        <Button type="submit" disabled={busy !== null}>
          {busy === "submit"
            ? "Submitting..."
            : mode === "edit"
              ? "Save changes"
              : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      {hint ? (
        <span className="font-normal text-muted-foreground">{hint}</span>
      ) : null}
      {children}
    </label>
  );
}

function formatExperience(profile: Tables<"worker_profiles">) {
  const experience = calculateExperience(
    profile.experience_started_at,
    profile.years_experience,
    profile.experience_months,
  );
  return `${experience.years} years${experience.months ? ` ${experience.months} months` : ""}`;
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
