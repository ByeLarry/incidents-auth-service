import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export const mailerOptionsFactory = (
  configService: ConfigService,
): MailerOptions => ({
  transport: {
    host: configService.get<string>('SMTP_HOST'),
    port: configService.get<number>('SMTP_PORT'),
    auth: {
      user: configService.get<string>('SMTP_USER'),
      pass: configService.get<string>('SMTP_PASS'),
    },
  },
  defaults: {
    from: configService.get<string>('SMTP_USER'),
  },
});
