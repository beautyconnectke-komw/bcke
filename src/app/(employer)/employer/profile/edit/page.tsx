import { ArrowLeft } from "lucide-react";
import { EmployerForm } from "@/components/employer/employer-form";
import { LinkButton, SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
} from "@/lib/domain/beauty-connect";

export default async function EmployerEditProfilePage() {
  try {
    const [profile, gallery] = await Promise.all([
      getCurrentEmployerProfile(),
      getCurrentEmployerGallery(),
    ]);
    if (!profile) return <SetupState />;
    return (
      <div className="mx-auto max-w-4xl">
        <LinkButton
          href="/employer/profile"
          variant="ghost"
          className="mb-5 px-0"
        >
          <ArrowLeft className="size-4" /> Back to profile
        </LinkButton>
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Account settings
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Edit your salon profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            All employer profile fields are instantly editable and update your
            public salon profile when saved.
          </p>
        </div>
        <EmployerForm profile={profile} gallery={gallery} mode="edit" />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
