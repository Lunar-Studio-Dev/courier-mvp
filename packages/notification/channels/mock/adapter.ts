import { NotificationAdapter } from "../../adapter";
import type { NotificationResult, NotificationChannel } from "../../types";

export class MockNotificationAdapter extends NotificationAdapter<{
  to: string;
  message: string;
}> {
  constructor(channel: NotificationChannel) {
    super(channel, "mock");
  }

  async send(payload: {
    to: string;
    message: string;
  }): Promise<NotificationResult> {
    console.log(
      `[MOCK ${this.channel.toUpperCase()}] To: ${payload.to} | ${payload.message}`,
    );
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      channel: this.channel,
      provider: "mock",
      timestamp: new Date(),
    };
  }

  validateRecipient(recipient: string): boolean {
    return recipient.length > 0;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
