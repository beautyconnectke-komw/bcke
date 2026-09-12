import { EmployerProfileView } from "@/components/employer/employer-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
  getCompanyContact,
} from "@/lib/domain/beauty-connect";

export default async function EmployerProfilePage() {
  try {
    const profilePromise = getCurrentEmployerProfile();
    const galleryPromise = getCurrentEmployerGallery();
    const companyContactPromise = getCompanyContact();
    const [profile, companyContact] = await Promise.all([
      profilePromise,
      companyContactPromise,
    ]);
    return profile ? (
      <EmployerProfileView
        profile={profile}
        galleryPromise={galleryPromise}
        companyContact={companyContact}
      />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
