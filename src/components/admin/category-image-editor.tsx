"use client";

import { useEffect, useRef, useState } from "react";
import { updateCategoryImageAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";
import { env } from "@/config/env";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/utils";

const IMAGE_BUCKET = "speciality-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CategoryImageEditor({
  categoryId,
  imagePath,
  imageUrl,
  categoryName,
}: {
  categoryId: string;
  imagePath: string | null;
  imageUrl: string | null;
  categoryName: string;
}) {
  const [savedPath, setSavedPath] = useState(imagePath);
  const [savedUrl, setSavedUrl] = useState(imageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setError(null);
  }

  async function saveImage() {
    if (!selectedFile) return;
    setBusy(true);
    setError(null);
    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        throw new Error("Your session has expired. Please log in again.");

      const extension =
        selectedFile.type === "image/png"
          ? "png"
          : selectedFile.type === "image/webp"
            ? "webp"
            : "jpg";
      const nextPath = `${user.id}/speciality-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await client.storage
        .from(IMAGE_BUCKET)
        .upload(nextPath, selectedFile, {
          upsert: false,
          contentType: selectedFile.type,
        });
      if (uploadError) throw uploadError;

      try {
        await updateCategoryImageAction(categoryId, nextPath);
      } catch (caught) {
        await client.storage.from(IMAGE_BUCKET).remove([nextPath]);
        throw caught;
      }

      if (savedPath) {
        await client.storage.from(IMAGE_BUCKET).remove([savedPath]);
      }
      setSavedPath(nextPath);
      setSavedUrl(publicImageUrl(env.supabase.url, IMAGE_BUCKET, nextPath));
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update the speciality image.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeImage() {
    if (!savedPath) return;
    setBusy(true);
    setError(null);
    try {
      const client = createClient();
      await updateCategoryImageAction(categoryId, null);
      await client.storage.from(IMAGE_BUCKET).remove([savedPath]);
      setSavedPath(null);
      setSavedUrl(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not remove the speciality image.",
      );
    } finally {
      setBusy(false);
    }
  }

  const displayedUrl = previewUrl ?? savedUrl;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {displayedUrl ? (
          <img
            src={displayedUrl}
            alt={`${categoryName} speciality`}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-xs text-muted-foreground">
            No image
          </span>
        )}
      </div>
      <div className="grid min-w-[13rem] gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.currentTarget.value = "";
            if (
              file &&
              (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)
            ) {
              chooseFile(null);
              setError("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
              return;
            }
            chooseFile(file);
          }}
          className="sr-only"
          aria-label={`Choose a new image for ${categoryName}`}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {savedPath ? "Edit photo" : "Add photo"}
          </Button>
          {selectedFile ? (
            <Button type="button" disabled={busy} onClick={saveImage}>
              {busy ? "Saving..." : "Save photo"}
            </Button>
          ) : null}
          {savedPath ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={removeImage}
            >
              Remove photo
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
