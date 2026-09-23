import { EmployerProfileView } from "@/components/employer/employer-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
  getCategories,
} from "@/lib/domain/beauty-connect";

export default async function EmployerProfilePage() {
  try {
    const profilePromise = getCurrentEmployerProfile();
    const galleryPromise = getCurrentEmployerGallery();
    const [profile, categories] = await Promise.all([
      profilePromise,
      getCategories(),
    ]);
    return profile ? (
      <EmployerProfileView
        profile={profile}
        categories={categories}
        galleryPromise={galleryPromise}
      />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
