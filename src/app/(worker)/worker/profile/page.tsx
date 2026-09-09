import { WorkerForm } from "@/components/worker/worker-form";
import { SectionHeading, SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerProfile,
  getCurrentWorkerPortfolio,
} from "@/lib/domain/beauty-connect";

export default async function WorkerProfilePage() {
  try {
    const [profile, categories] = await Promise.all([
      getCurrentWorkerProfile(),
      getCategories(),
    ]);
    const portfolio = profile ? await getCurrentWorkerPortfolio() : [];
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Your profile"
          title="Your work, in your words"
          description="Edit the details you want employers to see. Moderation and verification information stays private."
        />
        <div className="mt-8">
          {profile ? (
            <WorkerForm
              profile={profile}
              categories={categories}
              submittedPortfolio={portfolio}
              mode="edit"
            />
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
