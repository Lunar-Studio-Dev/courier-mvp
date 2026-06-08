"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2, Send, Save } from "lucide-react";
import { trpc } from "~/trpc/client";

interface ProviderOption {
  value: string;
  label: string;
  fields: { key: string; label: string; placeholder?: string }[];
}

interface ChannelCardProps {
  channel: "email" | "sms" | "whatsapp";
  title: string;
  icon: React.ReactNode;
  providers: ProviderOption[];
  config?: {
    id: string;
    provider: string;
    isActive: boolean | null;
    credentials: Record<string, string>;
    settings: Record<string, string> | null;
  };
}

export function ChannelCard({
  channel,
  title,
  icon,
  providers,
  config,
}: ChannelCardProps) {
  const [isActive, setIsActive] = useState(config?.isActive ?? false);
  const [provider, setProvider] = useState(
    config?.provider ?? providers[0]?.value ?? "",
  );
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testRecipient, setTestRecipient] = useState("");

  useEffect(() => {
    if (config) {
      setIsActive(config.isActive ?? false);
      setProvider(config.provider);
      // Don't prefill credentials since they're masked
    }
  }, [config]);

  const selectedProvider = providers.find((p) => p.value === provider);

  const utils = trpc.useUtils();

  const saveMutation = trpc.notifications.updateConfig.useMutation({
    onSuccess: () => {
      utils.notifications.getConfigs.invalidate();
      toast.success(`${title} configuration saved`);
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.notifications.testChannel.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave() {
    // Only include non-empty credential fields
    const creds: Record<string, string> = {};
    for (const field of selectedProvider?.fields ?? []) {
      const val = credentials[field.key];
      if (val) {
        creds[field.key] = val;
      } else if (config?.credentials[field.key]) {
        // Keep existing (masked) value reference — server will keep current if key absent
        // But we must send something, so we send the masked value to indicate "no change"
        creds[field.key] = config.credentials[field.key]!;
      }
    }

    saveMutation.mutate({
      channel,
      provider,
      isActive,
      credentials: creds,
    });
  }

  function handleTest() {
    if (!testRecipient.trim()) {
      toast.error("Enter a test recipient");
      return;
    }
    testMutation.mutate({ channel, testRecipient: testRecipient.trim() });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`${channel}-active`}
              className="text-sm text-muted-foreground"
            >
              {isActive ? "Active" : "Inactive"}
            </Label>
            <Switch
              id={`${channel}-active`}
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProvider?.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Input
              type="password"
              placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
              value={credentials[field.key] ?? ""}
              onChange={(e) =>
                setCredentials((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
            />
            {config?.credentials[field.key] && !credentials[field.key] && (
              <p className="text-xs text-muted-foreground">
                Current: {config.credentials[field.key]}
              </p>
            )}
          </div>
        ))}

        <div className="flex items-end gap-2 pt-2">
          <div className="flex-1 space-y-2">
            <Label>Test Recipient</Label>
            <Input
              placeholder={
                channel === "email"
                  ? "test@example.com"
                  : "+91XXXXXXXXXX"
              }
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Test
          </Button>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
