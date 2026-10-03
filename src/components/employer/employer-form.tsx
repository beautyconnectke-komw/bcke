"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  createEmployerProfileAction,
  removeEmployerGalleryImageAction,
} from "@/app/actions/beauty-connect";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import { kenyaCounties } from "@/config/kenya";
import {
  employerProfileSchema,
  type EmployerProfileInput,
} from "@/lib/validations/beauty-connect";
import type { Category, EmployerProfile } from "@/lib/domain/beauty-connect";
import type { Tables } from "@/types/database";
import { publicImageUrl } from "@/lib/utils";
import { Button } from "@/components/shared/ui";

type FormValues = Omit<
  EmployerProfileInput,
  "salonInfo" | "location" | "county" | "town" | "categoryId"
> & {
  county: string;
  town: string;
  categoryId: string;
};

type PreviewFile = { file: File; url: string };

export function EmployerForm({
  profile,
  categories,
  gallery = [],
  mode = "onboarding",
}: {
  profile: EmployerProfile | null;
  categories: Category[];
  gallery?: Tables<"employer_gallery">[];
  mode?: "onboarding" | "edit";
}) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    publicImageUrl(
      env.supabase.url,
      "employer-images",
      profile?.profile_image_path,
    ),
  );
  const [savedGallery, setSavedGallery] = useState(gallery);
  const [newGallery, setNewGallery] = useState<PreviewFile[]>([]);
  const [removingGalleryId, setRemovingGalleryId] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, control } = useForm<FormValues>({
    defaultValues: {
      businessName: profile?.business_name ?? "",
      contactPerson: profile?.contact_person ?? "",
      phone: profile?.phone ?? "",
      businessEmail: profile?.business_email ?? "",
      county: getSupportedCounty(profile?.county),
      town: profile?.town ?? profile?.location ?? "",
      addressLine: profile?.address_line ?? "",
      description: profile?.description ?? "",
      profileImagePath: profile?.profile_image_path ?? null,
      categoryId: profile?.category_id ?? "",
      extraSpecialtyIds: profile?.extra_specialty_ids ?? [],
    },
  });
  const mainSpecialtyId = useWatch({ control, name: "categoryId" });
  const selectedExtraSpecialtyIds =
    useWatch({ control, name: "extraSpecialtyIds" }) ?? [];
  const categoryField = register("categoryId");
  const extraCategories = categories.filter(
    (category) => category.id !== mainSpecialtyId,
  );

  function selectProfileImage(file: File | null) {
    if (profilePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreview);
    }
    setProfileImage(file);
    setProfilePreview(
      file
        ? URL.createObjectURL(file)
        : publicImageUrl(
            env.supabase.url,
            "employer-images",
            profile?.profile_image_path,
          ),
    );
  }

  function selectGallery(files: FileList | null) {
    const capacity = Math.max(0, 12 - savedGallery.length - newGallery.length);
    const selected = Array.from(files ?? []).slice(0, capacity);
    setNewGallery((current) => [
      ...current,
      ...selected.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removeNewGalleryImage(index: number) {
    setNewGallery((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function removeSavedGalleryImage(id: string) {
    setRemovingGalleryId(id);
    setError(null);
    try {
      await removeEmployerGalleryImageAction(id);
      setSavedGallery((current) => current.filter((image) => image.id !== id));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not remove that salon image.",
      );
    } finally {
      setRemovingGalleryId(null);
    }
  }

  async function upload(
    client: ReturnType<typeof createClient>,
    file: File,
    userId: string,
    prefix: string,
  ) {
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from("employer-images")
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    return path;
  }

  async function submit(values: FormValues) {
    setBusy(true);
    setError(null);
    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const profileImagePath = profileImage
        ? await upload(client, profileImage, user.id, "profile")
        : values.profileImagePath;
      const parsed = employerProfileSchema.parse({
        ...values,
        phone: values.phone || null,
        businessEmail: values.businessEmail || null,
        description: values.description || null,
        county: values.county,
        town: values.town,
        addressLine: values.addressLine || null,
        profileImagePath,
        categoryId: values.categoryId,
        extraSpecialtyIds: [
          ...new Set(
            (values.extraSpecialtyIds ?? []).filter(
              (specialtyId) => specialtyId !== values.categoryId,
            ),
          ),
        ],
        salonInfo: getSalonInfo(profile?.salon_info),
      });
      const employerId = await createEmployerProfileAction(parsed);
      if (!employerId) {
        throw new Error("We could not create your salon profile.");
      }

      const nextDisplayOrder =
        Math.max(0, ...savedGallery.map((image) => image.display_order)) + 1;
      for (const [index, item] of newGallery.entries()) {
        const path = await upload(
          client,
          item.file,
          user.id,
          `salon-${nextDisplayOrder + index}`,
        );
        const { error: galleryError } = await client
          .from("employer_gallery")
          .insert({
            employer_profile_id: employerId,
            storage_path: path,
            display_order: nextDisplayOrder + index,
          });
        if (galleryError) throw galleryError;
      }

      setNewGallery([]);
      router.push(mode === "edit" ? "/employer/profile" : "/employer/home");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not save your salon profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid min-w-0 gap-6">
      {mode === "edit" ? (
        <section className="flex items-center gap-4 border border-border p-4 sm:p-6">
          <ProfileImagePreview src={profilePreview} size="large" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Salon profile
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold">
              {profile?.business_name}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {[
                profile?.town ?? profile?.location,
                profile?.county,
                profile?.address_line,
              ]
                .filter(Boolean)
                .join(" · ") || "Location not added"}
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 rounded-2xl border border-[#dfe5dc] bg-[#fbf9fa] p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <h2 className="text-lg font-semibold">
            {mode === "edit"
              ? "Business identity and location"
              : "Salon identity and location"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "edit"
              ? "These employer details update instantly when you save."
              : "Start with the details workers need to find and trust your salon."}
          </p>
        </div>
        <Field label="Salon or business name">
          <input
            required
            {...register("businessName")}
            className="field"
            placeholder="Your salon"
          />
        </Field>
        <Field label="Contact person">
          <input
            {...register("contactPerson")}
            className="field"
            placeholder="Your name"
          />
        </Field>
        <Field label="County">
          <select required {...register("county")} className="field">
            <option value="">Choose your county</option>
            {kenyaCounties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Town"
          hint="Use the town or area where your salon is based."
        >
          <input
            required
            {...register("town")}
            className="field"
            placeholder="e.g. Westlands"
          />
        </Field>
        <Field label="Address or landmark" hint="Optional">
          <input
            {...register("addressLine")}
            className="field"
            placeholder="Street, building, or nearby landmark"
          />
        </Field>
      </section>

      <section className="grid gap-5 border border-border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Edit profile" : "Contact and salon details"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the details workers use when deciding whether to connect.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone">
            <input
              {...register("phone")}
              className="field"
              placeholder="+254 ..."
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              {...register("businessEmail")}
              className="field"
              placeholder="salon@example.com"
            />
          </Field>
        </div>
        <Field label="Salon description">
          <textarea
            {...register("description")}
            className="field min-h-28 py-3"
            placeholder="Tell workers about your salon and the way you work."
          />
        </Field>
      </section>

      <section className="grid gap-5 border border-border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Salon specialities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one main speciality and any additional specialities from the
            same admin-managed catalogue used by workers.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Main speciality">
            <select required {...categoryField} className="field">
              <option value="">Choose a speciality</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          {extraCategories.map((category) => {
            const isSelected = selectedExtraSpecialtyIds.includes(category.id);
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
          {selectedExtraSpecialtyIds.length} of 12 additional specialities
          selected.
        </p>
        {getLegacyServices(profile?.salon_info) ? (
          <div className="border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Legacy services text preserved
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {getLegacyServices(profile?.salon_info)}
            </p>
            <p className="mt-1 text-xs">
              This original value is retained for review and is not used for
              speciality targeting.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 border border-border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Profile image</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a clear image of your salon or brand.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProfileImagePreview src={profilePreview} size="medium" />
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              selectProfileImage(event.target.files?.[0] ?? null)
            }
            className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
          />
        </div>
      </section>

      <section className="grid gap-5 border border-border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Salon images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add up to twelve images that show your space and services.
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={savedGallery.length + newGallery.length >= 12}
          onChange={(event) => {
            selectGallery(event.target.files);
            event.currentTarget.value = "";
          }}
          className="field file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5 disabled:opacity-50"
        />
        {savedGallery.length || newGallery.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {savedGallery.map((image) => {
              const src = publicImageUrl(
                env.supabase.url,
                image.storage_bucket,
                image.storage_path,
              );
              return (
                <div key={image.id} className="relative aspect-square bg-muted">
                  {src ? (
                    <Image
                      src={src}
                      alt="Salon"
                      fill
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 25vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={removingGalleryId === image.id}
                    onClick={() => removeSavedGalleryImage(image.id)}
                    className="absolute right-1 top-1 bg-foreground px-2 py-1 text-xs text-background disabled:opacity-50"
                  >
                    {removingGalleryId === image.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })}
            {newGallery.map((image, index) => (
              <div key={image.url} className="relative aspect-square bg-muted">
                <img
                  src={image.url}
                  alt={`New salon preview ${index + 1}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewGalleryImage(index)}
                  className="absolute right-1 top-1 bg-foreground px-2 py-1 text-xs text-background"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No salon images added yet.
          </p>
        )}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy
          ? "Saving..."
          : mode === "edit"
            ? "Save changes"
            : "Create salon profile"}
      </Button>
    </form>
  );
}

function ProfileImagePreview({
  src,
  size,
}: {
  src: string | null;
  size: "medium" | "large";
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden bg-muted ${
        size === "large" ? "size-20" : "size-24"
      }`}
    >
      {src ? (
        <img
          src={src}
          alt="Salon profile preview"
          className="size-full object-cover"
        />
      ) : (
        <span className="px-2 text-center text-xs text-muted-foreground">
          No image
        </span>
      )}
    </div>
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

function getSalonInfo(
  value: EmployerProfile["salon_info"] | undefined,
): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getLegacyServices(
  value: EmployerProfile["salon_info"] | undefined,
): string {
  const salonInfo = getSalonInfo(value);
  return typeof salonInfo.services === "string" ? salonInfo.services : "";
}

function getSupportedCounty(
  value: string | null | undefined,
): (typeof kenyaCounties)[number] | "" {
  return value && (kenyaCounties as readonly string[]).includes(value)
    ? (value as (typeof kenyaCounties)[number])
    : "";
}
