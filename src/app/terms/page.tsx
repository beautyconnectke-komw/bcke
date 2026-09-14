import type { Metadata } from "next";
import { GeneralLegalPage } from "@/components/shared/general-legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions | Beauty Connect",
  description:
    "The canonical Beauty Connect Terms & Conditions for Workers, Employers and visitors in Kenya.",
};

export default function TermsPage() {
  return <GeneralLegalPage kind="terms" />;
}
