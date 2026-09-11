import { WorkerProfileView } from "@/components/worker/worker-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerProfile,
  getCurrentWorkerPortfolio,
} from "@/lib/domain/beauty-connect";

export default async function WorkerProfilePage() {
  try {
    const [profile, categories, portfolio] = await Promise.all([
      getCurrentWorkerProfile(),
      getCategories(),
      getCurrentWorkerPortfolio(),
    ]);
    return profile ? (
      <WorkerProfileView
        profile={profile}
        categories={categories}
        portfolio={portfolio}
      />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
