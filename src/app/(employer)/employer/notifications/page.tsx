import { getNotifications } from "@/lib/domain/beauty-connect";
import { NotificationList } from "@/components/shared/notification-list";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function EmployerNotificationsPage() {
  try {
    const notifications = await getNotifications();
    return (
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Updates"
          title="Notifications"
          description="See when workers respond and connections complete."
        />
        <div className="mt-8">
          <NotificationList notifications={notifications} />
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
