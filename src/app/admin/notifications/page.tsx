import { getNotifications } from "@/lib/domain/beauty-connect";
import { NotificationList } from "@/components/shared/notification-list";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function AdminNotificationsPage() {
  try {
    const notifications = await getNotifications();
    return (
      <div className="max-w-3xl">
        <SectionHeading
          eyebrow="System updates"
          title="Notifications"
          description="Your admin account’s notification stream."
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
