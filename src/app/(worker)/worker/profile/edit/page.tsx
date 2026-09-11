import { ArrowLeft } from "lucide-react";
import { WorkerForm } from "@/components/worker/worker-form";
import { LinkButton, SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerPortfolio,
  getCurrentWorkerProfile,
} from "@/lib/domain/beauty-connect";

export default async function WorkerEditProfilePage() {
  try {
    const [profile, categories, portfolio] = await Promise.all([
      getCurrentWorkerProfile(),
      getCategories(),
      getCurrentWorkerPortfolio(),
    ]);
    if (!profile) return <SetupState />;
    return (
      <div className="mx-auto max-w-4xl">
        <LinkButton
          href="/worker/profile"
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
            Edit your profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Save contact details instantly. Professional identity changes are
            clearly separated and sent to an admin for approval.
          </p>
        </div>
        <WorkerForm
          profile={profile}
          categories={categories}
          submittedPortfolio={portfolio}
          mode="edit"
        />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
