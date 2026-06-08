"use client";

import { Mail, MessageSquare, Phone } from "lucide-react";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { Skeleton } from "~/components/ui/skeleton";
import { ChannelCard } from "./_components/channel-card";
import { EventLogTable } from "./_components/event-log-table";

const EMAIL_PROVIDERS = [
  {
    value: "resend",
    label: "Resend",
    fields: [{ key: "apiKey", label: "API Key" }],
  },
  {
    value: "smtp",
    label: "SMTP",
    fields: [
      { key: "host", label: "Host", placeholder: "smtp.example.com" },
      { key: "port", label: "Port", placeholder: "587" },
      { key: "secure", label: "Secure (true/false)", placeholder: "false" },
      { key: "user", label: "Username" },
      { key: "pass", label: "Password" },
    ],
  },
  {
    value: "sendgrid",
    label: "SendGrid",
    fields: [{ key: "apiKey", label: "API Key" }],
  },
  {
    value: "aws_ses",
    label: "AWS SES",
    fields: [
      { key: "accessKeyId", label: "Access Key ID" },
      { key: "secretAccessKey", label: "Secret Access Key" },
      { key: "region", label: "Region", placeholder: "ap-south-1" },
    ],
  },
];

const SMS_PROVIDERS = [
  {
    value: "msg91",
    label: "MSG91",
    fields: [
      { key: "authKey", label: "Auth Key" },
      { key: "senderId", label: "Sender ID", placeholder: "TPCIND" },
      { key: "dltTemplateId", label: "DLT Template ID" },
    ],
  },
  {
    value: "twilio",
    label: "Twilio",
    fields: [
      { key: "accountSid", label: "Account SID" },
      { key: "authToken", label: "Auth Token" },
      { key: "phoneNumber", label: "Phone Number", placeholder: "+1..." },
    ],
  },
  {
    value: "aws_sns",
    label: "AWS SNS",
    fields: [
      { key: "accessKeyId", label: "Access Key ID" },
      { key: "secretAccessKey", label: "Secret Access Key" },
      { key: "region", label: "Region", placeholder: "ap-south-1" },
    ],
  },
  {
    value: "textlocal",
    label: "Textlocal",
    fields: [
      { key: "apiKey", label: "API Key" },
      { key: "sender", label: "Sender", placeholder: "TPCIND" },
    ],
  },
];

const WHATSAPP_PROVIDERS = [
  {
    value: "gupshup",
    label: "Gupshup",
    fields: [
      { key: "apiKey", label: "API Key" },
      { key: "appName", label: "App Name" },
      { key: "sourceNumber", label: "Source Number", placeholder: "+91..." },
    ],
  },
  {
    value: "twilio",
    label: "Twilio",
    fields: [
      { key: "accountSid", label: "Account SID" },
      { key: "authToken", label: "Auth Token" },
      { key: "phoneNumber", label: "Phone Number", placeholder: "+1..." },
    ],
  },
  {
    value: "meta",
    label: "Meta Business API",
    fields: [
      { key: "accessToken", label: "Access Token" },
      { key: "phoneNumberId", label: "Phone Number ID" },
      { key: "businessAccountId", label: "Business Account ID" },
    ],
  },
];

export default function NotificationSettingsPage() {
  const { data: configs, isLoading } = trpc.notifications.getConfigs.useQuery();

  const emailConfig = configs?.find((c) => c.channel === "email");
  const smsConfig = configs?.find((c) => c.channel === "sms");
  const whatsappConfig = configs?.find((c) => c.channel === "whatsapp");

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Configure email, SMS, and WhatsApp notification providers for shipment lifecycle events."
      />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <ChannelCard
            channel="email"
            title="Email"
            icon={<Mail className="h-5 w-5 text-primary" />}
            providers={EMAIL_PROVIDERS}
            config={emailConfig}
          />
          <ChannelCard
            channel="sms"
            title="SMS"
            icon={<MessageSquare className="h-5 w-5 text-primary" />}
            providers={SMS_PROVIDERS}
            config={smsConfig}
          />
          <ChannelCard
            channel="whatsapp"
            title="WhatsApp"
            icon={<Phone className="h-5 w-5 text-primary" />}
            providers={WHATSAPP_PROVIDERS}
            config={whatsappConfig}
          />
        </div>
      )}

      <EventLogTable />
    </div>
  );
}
