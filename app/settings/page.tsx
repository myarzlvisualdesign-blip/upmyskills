import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">Settings</p>
        <h1 className="text-4xl font-black tracking-tight">Provider configuration</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          The app ships with a local deterministic provider so tools run immediately. API key fields are stored in
          browser storage for future provider wiring and local experiments.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
