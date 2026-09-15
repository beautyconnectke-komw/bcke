import { WorkerProfileView } from "@/components/worker/worker-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerProfile,
  getCurrentWorkerPortfolio,
  getCurrentWorkerReactivationRequest,
} from "@/lib/domain/beauty-connect";

export default async function WorkerProfilePage() {
  try {
    const profilePromise = getCurrentWorkerProfile();
    const categoriesPromise = getCategories();
    const portfolioPromise = getCurrentWorkerPortfolio();
    const reactivationRequestPromise = getCurrentWorkerReactivationRequest();
    const [profile, categories, reactivationRequest] = await Promise.all([
      profilePromise,
      categoriesPromise,
      reactivationRequestPromise,
    ]);
    return profile ? (
      <WorkerProfileView
        profile={profile}
        categories={categories}
        portfolioPromise={portfolioPromise}
        reactivationRequest={reactivationRequest}
      />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
