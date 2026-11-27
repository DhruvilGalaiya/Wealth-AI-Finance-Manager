import { checkUser } from "@/lib/checkUser";
import { getRules } from "@/actions/rules";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "./settings-form";
import { RulesManager } from "./rules-manager";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, rules] = await Promise.all([checkUser(), getRules()]);
  return (
    <>
      <PageHeader title="Settings" description="Currency, appearance and automation." />
      <div className="max-w-2xl space-y-4">
        <SettingsForm currency={user.currency} />
        <div id="rules" className="scroll-mt-6">
          <RulesManager rules={rules} />
        </div>
      </div>
    </>
  );
}
