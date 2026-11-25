import { checkUser } from "@/lib/checkUser";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await checkUser();
  return (
    <>
      <PageHeader title="Settings" description="Personalise how Welth looks and shows your money." />
      <SettingsForm currency={user.currency} />
    </>
  );
}
