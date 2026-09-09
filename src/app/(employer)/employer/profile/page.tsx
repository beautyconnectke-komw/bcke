import { EmployerForm } from "@/components/employer/employer-form";
import { SectionHeading, SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
} from "@/lib/domain/beauty-connect";

export default async function EmployerProfilePage() {
  try {
    const [profile, gallery] = await Promise.all([
      getCurrentEmployerProfile(),
      getCurrentEmployerGallery(),
    ]);
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Salon profile"
          title={profile?.business_name ?? "Your salon profile"}
          description="Keep your public profile clear, current, and easy to trust."
        />
        <div className="mt-8">
          {profile ? (
            <EmployerForm profile={profile} gallery={gallery} mode="edit" />
          ) : (
            <SetupState />
          )}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
