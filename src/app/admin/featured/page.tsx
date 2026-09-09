import { getAdminWorkers } from "@/lib/domain/beauty-connect";
import { FeaturedWorkerManager } from "@/components/admin/admin-controls";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function AdminFeaturedPage() {
  try {
    const workers = await getAdminWorkers();
    return (
      <div className="max-w-4xl">
        <SectionHeading
          eyebrow="Employer home"
          title="Featured workers"
          description="Choose and order the approved workers employers should see first."
        />
        <div className="mt-8">
          <FeaturedWorkerManager workers={workers} />
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
