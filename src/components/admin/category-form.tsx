"use client";

import { useState } from "react";
import { createCategoryAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function CategoryForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createCategoryAction({ name, slug, displayOrder: 0 });
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
      className="grid gap-3 border border-border bg-background p-5 sm:grid-cols-[1fr_1fr_auto]"
    >
      <input
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="field"
        placeholder="Speciality name"
      />
      <input
        required
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        className="field"
        placeholder="speciality-slug"
      />
      <Button disabled={busy}>{busy ? "Adding…" : "Add speciality"}</Button>
      {error ? (
        <p className="text-sm text-red-700 sm:col-span-3">{error}</p>
      ) : null}
    </form>
  );
}
