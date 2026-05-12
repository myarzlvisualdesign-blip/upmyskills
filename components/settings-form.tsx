"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Settings = {
  provider: string;
  openaiKey: string;
  anthropicKey: string;
  localEndpoint: string;
};

const defaultSettings: Settings = {
  provider: "local",
  openaiKey: "",
  anthropicKey: "",
  localEndpoint: "http://localhost:11434"
};

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("upmyskills.settings");
    if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
  }, []);

  function update(key: keyof Settings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem("upmyskills.settings", JSON.stringify(settings));
    setSaved(true);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>LLM provider abstraction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Active provider</Label>
          <Select value={settings.provider} onChange={(event) => update("provider", event.target.value)}>
            <option value="local">Local deterministic provider</option>
            <option value="openai">OpenAI-compatible provider metadata</option>
            <option value="anthropic">Anthropic-compatible provider metadata</option>
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>OpenAI API key</Label>
            <Input type="password" value={settings.openaiKey} onChange={(event) => update("openaiKey", event.target.value)} placeholder="sk-..." />
          </div>
          <div className="space-y-2">
            <Label>Anthropic API key</Label>
            <Input type="password" value={settings.anthropicKey} onChange={(event) => update("anthropicKey", event.target.value)} placeholder="sk-ant-..." />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Local model endpoint</Label>
          <Input value={settings.localEndpoint} onChange={(event) => update("localEndpoint", event.target.value)} />
        </div>
        <Button onClick={save}>
          <Save className="size-4" />
          {saved ? "Saved" : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
