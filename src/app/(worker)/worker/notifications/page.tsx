import { getNotifications } from "@/lib/domain/beauty-connect";
import { NotificationList } from "@/components/shared/notification-list";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function WorkerNotificationsPage() {
  try {
    const notifications = await getNotifications();
    return (
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Updates"
          title="Notifications"
          description="Stay close to the conversations and decisions that matter."
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
