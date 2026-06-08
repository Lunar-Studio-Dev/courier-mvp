import type { NotificationChannel, NotificationResult } from "./types";

export abstract class NotificationAdapter<TPayload> {
  protected channel: NotificationChannel;
  protected providerName: string;

  constructor(channel: NotificationChannel, providerName: string) {
    this.channel = channel;
    this.providerName = providerName;
  }

  abstract send(payload: TPayload): Promise<NotificationResult>;

  async sendBulk(payloads: TPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)));
  }

  abstract validateRecipient(recipient: string): boolean;

  abstract healthCheck(): Promise<boolean>;

  getChannel(): NotificationChannel {
    return this.channel;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
