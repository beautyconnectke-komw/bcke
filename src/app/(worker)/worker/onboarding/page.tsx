import { redirect } from "next/navigation";
import { WorkerForm } from "@/components/worker/worker-form";
import { SectionHeading, SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerPortfolio,
  getCurrentWorkerProfile,
} from "@/lib/domain/beauty-connect";

export default async function WorkerOnboardingPage() {
  try {
    const [profile, categories] = await Promise.all([
      getCurrentWorkerProfile(),
      getCategories(),
    ]);
    if (
      profile?.verification_status === "pending_review" ||
      profile?.verification_status === "approved"
    ) {
      redirect("/worker/profile");
    }
    const portfolio = profile ? await getCurrentWorkerPortfolio() : [];
    return (
      <div className="mx-auto w-full min-w-0 max-w-4xl px-2 sm:px-0">
        <SectionHeading
          eyebrow="Worker onboarding"
          title={
            profile ? "Keep shaping your profile" : "Tell us about your work"
          }
          description="Your profile stays private until it has been reviewed and approved."
        />
        <div className="mt-8 min-w-0">
          <WorkerForm
            profile={profile}
            categories={categories}
            submittedPortfolio={portfolio}
            mode="onboarding"
          />
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
