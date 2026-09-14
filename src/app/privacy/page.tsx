import type { Metadata } from "next";
import { GeneralLegalPage } from "@/components/shared/general-legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Beauty Connect",
  description:
    "The canonical Beauty Connect Privacy Policy for Workers, Employers and visitors in Kenya.",
};

export default function PrivacyPage() {
  return <GeneralLegalPage kind="privacy" />;
}
