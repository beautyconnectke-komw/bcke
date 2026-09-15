import { AccountSettingsPage } from "@/components/shared/account-settings-page";
import { getCompanyContact } from "@/lib/domain/beauty-connect";

export default async function EmployerAccountSettingsPage() {
  const companyContact = await getCompanyContact();
  return (
    <AccountSettingsPage role="employer" companyContact={companyContact} />
  );
}
