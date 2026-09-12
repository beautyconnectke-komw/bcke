"use client";

import { useEffect, useState } from "react";
import { createCategoryAction } from "@/app/actions/beauty-connect";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/shared/ui";

export function CategoryForm() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function selectImage(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const slug = createSlug(name);
      if (!slug)
        throw new Error("Enter a speciality name using letters or numbers.");

      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        throw new Error("Your session has expired. Please log in again.");

      let imagePath: string | null = null;
      if (image) {
        const extension =
          image.type === "image/png"
            ? "png"
            : image.type === "image/webp"
              ? "webp"
              : "jpg";
        imagePath = `${user.id}/speciality-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage
          .from("speciality-images")
          .upload(imagePath, image, { upsert: false, contentType: image.type });
        if (uploadError) throw uploadError;
      }

      try {
        await createCategoryAction({
          name,
          slug,
          displayOrder: 0,
          imagePath,
        });
      } catch (caught) {
        if (imagePath) {
          await client.storage.from("speciality-images").remove([imagePath]);
        }
        throw caught;
      }

      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create speciality.",
      );
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 border border-border bg-background p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field"
          placeholder="Speciality name, e.g. Nail Technician"
        />
        <Button disabled={busy}>{busy ? "Adding…" : "Add speciality"}</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <label htmlFor="speciality-image" className="text-sm font-medium">
            Carousel image{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Use a JPG, PNG, or WebP image up to 5 MB.
          </p>
          <input
            id="speciality-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (
                file &&
                (!["image/jpeg", "image/png", "image/webp"].includes(
                  file.type,
                ) ||
                  file.size > 5 * 1024 * 1024)
              ) {
                selectImage(null);
                setError("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
                return;
              }
              selectImage(file);
            }}
            className="field mt-3 file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5"
          />
        </div>
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Selected speciality preview"
            className="size-20 rounded-xl object-cover"
          />
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
