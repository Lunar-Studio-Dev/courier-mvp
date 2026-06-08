import type { NotificationAdapter } from "../../adapter";
import type { SmsPayload, ProviderConfig } from "../../types";
import { Msg91SmsAdapter } from "./providers/msg91";
import { TwilioSmsAdapter } from "./providers/twilio";
import { AwsSnsSmsAdapter } from "./providers/aws-sns";
import { TextlocalSmsAdapter } from "./providers/textlocal";

export class SmsNotificationFactory {
  static createAdapter(
    provider: string,
    config: ProviderConfig,
  ): NotificationAdapter<SmsPayload> {
    switch (provider) {
      case "msg91":
        return new Msg91SmsAdapter(config);
      case "twilio":
        return new TwilioSmsAdapter(config);
      case "aws_sns":
        return new AwsSnsSmsAdapter(config);
      case "textlocal":
        return new TextlocalSmsAdapter(config);
      default:
        throw new Error(`Unknown SMS provider: ${provider}`);
    }
  }
}
