import { WorkerProfileView } from "@/components/worker/worker-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCategories,
  getCurrentWorkerProfile,
  getCurrentWorkerPortfolio,
  getCurrentWorkerReactivationRequest,
  getCompanyContact,
} from "@/lib/domain/beauty-connect";

export default async function WorkerProfilePage() {
  try {
    const profilePromise = getCurrentWorkerProfile();
    const categoriesPromise = getCategories();
    const portfolioPromise = getCurrentWorkerPortfolio();
    const reactivationRequestPromise = getCurrentWorkerReactivationRequest();
    const companyContactPromise = getCompanyContact();
    const [profile, categories, reactivationRequest, companyContact] =
      await Promise.all([
        profilePromise,
        categoriesPromise,
        reactivationRequestPromise,
        companyContactPromise,
      ]);
    return profile ? (
      <WorkerProfileView
        profile={profile}
        categories={categories}
        portfolioPromise={portfolioPromise}
        reactivationRequest={reactivationRequest}
        companyContact={companyContact}
      />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
