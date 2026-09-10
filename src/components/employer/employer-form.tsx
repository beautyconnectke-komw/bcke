"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  createEmployerProfileAction,
  removeEmployerGalleryImageAction,
} from "@/app/actions/beauty-connect";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import {
  employerProfileSchema,
  type EmployerProfileInput,
} from "@/lib/validations/beauty-connect";
import type { EmployerProfile } from "@/lib/domain/beauty-connect";
import type { Tables } from "@/types/database";
import { publicImageUrl } from "@/lib/utils";
import { Button } from "@/components/shared/ui";

type FormValues = Omit<EmployerProfileInput, "salonInfo"> & {
  salonServices: string;
};

type PreviewFile = { file: File; url: string };

export function EmployerForm({
  profile,
  gallery = [],
  mode = "onboarding",
}: {
  profile: EmployerProfile | null;
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
  const existingServices =
    typeof profile?.salon_info === "object" &&
    profile.salon_info &&
    "services" in profile.salon_info
      ? String(profile.salon_info.services ?? "")
      : "";
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      businessName: profile?.business_name ?? "",
      contactPerson: profile?.contact_person ?? "",
      phone: profile?.phone ?? "",
      businessEmail: profile?.business_email ?? "",
      location: profile?.location ?? "",
      addressLine: profile?.address_line ?? "",
      description: profile?.description ?? "",
      profileImagePath: profile?.profile_image_path ?? null,
      salonServices: existingServices,
    },
  });

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
        location: values.location || null,
        addressLine: values.addressLine || null,
        profileImagePath,
        salonInfo: { services: values.salonServices.trim() },
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
              {[profile?.location, profile?.address_line]
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
        <Field label="Location">
          <input
            {...register("location")}
            className="field"
            placeholder="Nairobi, Kenya"
          />
        </Field>
        <Field label="Address">
          <input
            {...register("addressLine")}
            className="field"
            placeholder="Street or neighbourhood"
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
        <Field label="Services offered" hint="Separate services with commas">
          <input
            {...register("salonServices")}
            className="field"
            placeholder="Hair, nails, makeup"
          />
        </Field>
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
            {savedGallery.map((image) => (
              <div key={image.id} className="relative aspect-square bg-muted">
                <img
                  src={
                    publicImageUrl(
                      env.supabase.url,
                      image.storage_bucket,
                      image.storage_path,
                    ) ?? undefined
                  }
                  alt="Salon"
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  disabled={removingGalleryId === image.id}
                  onClick={() => removeSavedGalleryImage(image.id)}
                  className="absolute right-1 top-1 bg-foreground px-2 py-1 text-xs text-background disabled:opacity-50"
                >
                  {removingGalleryId === image.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
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
