import { redirect } from "next/navigation";

export default function WorkerPrivacyPage() {
  redirect("/privacy#privacy-workers");
}
