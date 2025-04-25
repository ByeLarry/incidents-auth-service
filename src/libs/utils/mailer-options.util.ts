import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

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
  template: {
    dir: join(__dirname, '..', '..', '..', 'src', 'templates', 'email'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});
