import { EmployerProfileView } from "@/components/employer/employer-profile-view";
import { SetupState } from "@/components/shared/ui";
import {
  getCurrentEmployerGallery,
  getCurrentEmployerProfile,
} from "@/lib/domain/beauty-connect";

export default async function EmployerProfilePage() {
  try {
    const [profile, gallery] = await Promise.all([
      getCurrentEmployerProfile(),
      getCurrentEmployerGallery(),
    ]);
    return profile ? (
      <EmployerProfileView profile={profile} gallery={gallery} />
    ) : (
      <SetupState />
    );
  } catch {
    return <SetupState />;
  }
}
