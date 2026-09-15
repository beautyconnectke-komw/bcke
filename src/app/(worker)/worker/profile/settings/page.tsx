import { AccountSettingsPage } from "@/components/shared/account-settings-page";
import { getCompanyContact } from "@/lib/domain/beauty-connect";

export default async function WorkerAccountSettingsPage() {
  const companyContact = await getCompanyContact();
  return <AccountSettingsPage role="worker" companyContact={companyContact} />;
}
