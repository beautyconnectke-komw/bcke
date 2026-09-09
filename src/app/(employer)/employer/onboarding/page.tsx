import { EmployerForm } from "@/components/employer/employer-form";
import { SectionHeading, SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
} from "@/lib/domain/beauty-connect";

export default async function EmployerOnboardingPage() {
  try {
    const [profile, gallery] = await Promise.all([
      getCurrentEmployerProfile(),
      getCurrentEmployerGallery(),
    ]);
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Employer onboarding"
          title={
            profile
              ? "Keep your salon profile current"
              : "Tell workers about your salon"
          }
          description="A complete profile helps workers make a confident decision about your request."
        />
        <div className="mt-8">
          <EmployerForm profile={profile} gallery={gallery} />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <SetupState
        detail={
          error instanceof Error
            ? error.message
            : "The employer profile could not be loaded."
        }
      />
    );
  }
}
