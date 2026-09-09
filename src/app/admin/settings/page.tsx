import { getAdminEmailWhitelist } from "@/lib/domain/beauty-connect";
import {
  AdminWhitelistForm,
  AdminWhitelistRemove,
} from "@/components/admin/admin-controls";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function AdminSettingsPage() {
  try {
    const whitelist = await getAdminEmailWhitelist();
    return (
      <div className="max-w-3xl">
        <SectionHeading
          eyebrow="Internal access"
          title="Settings"
          description="Manage the email addresses allowed to become Beauty Connect administrators."
        />
        <section className="mt-8 grid gap-5 border border-border bg-background p-6">
          <div>
            <h2 className="font-semibold">Admin email whitelist</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              An email must already exist in Supabase Auth before it can be
              whitelisted. Whitelisting also gives that existing account admin
              access.
            </p>
          </div>
          <AdminWhitelistForm />
          <div className="grid gap-2 border-t border-border pt-5">
            {whitelist.map((entry) => (
              <div
                key={entry.email}
                className="flex flex-wrap items-center justify-between gap-3 border border-border px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{entry.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Added {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
                <AdminWhitelistRemove email={entry.email} />
              </div>
            ))}
            {whitelist.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No admin emails have been whitelisted yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
