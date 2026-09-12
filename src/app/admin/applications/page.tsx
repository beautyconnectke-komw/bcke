import { ApplicationTabs } from "@/components/admin/application-tabs";
import { SectionHeading } from "@/components/shared/ui";

export default function AdminApplicationsPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="Moderation"
        title="Applications"
        description="Review worker applications and reactivation requests."
      />
      <ApplicationTabs />
    </div>
  );
}
