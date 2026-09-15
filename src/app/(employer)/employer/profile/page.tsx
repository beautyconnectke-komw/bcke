import { EmployerProfileView } from "@/components/employer/employer-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
} from "@/lib/domain/beauty-connect";

export default async function EmployerProfilePage() {
  try {
    const profilePromise = getCurrentEmployerProfile();
    const galleryPromise = getCurrentEmployerGallery();
    const [profile] = await Promise.all([profilePromise]);
    return profile ? (
      <EmployerProfileView profile={profile} galleryPromise={galleryPromise} />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
