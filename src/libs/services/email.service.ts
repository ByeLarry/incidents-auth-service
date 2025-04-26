import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EMAIL_CONSTANTS } from '../constants/email.constants';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private isEmailEnabled = false;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.checkEmailConfiguration();
  }

  private checkEmailConfiguration() {
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
    ];

    const missingVars = requiredEnvVars.filter(
      (envVar) => !this.configService.get(envVar),
    );

    if (missingVars.length > 0) {
      this.logger.warn(
        `Email service is disabled. Missing required environment variables: ${missingVars.join(
          ', ',
        )}`,
      );
      this.isEmailEnabled = false;
    } else {
      this.isEmailEnabled = true;
      this.logger.log('Email service is enabled and configured');
    }

    this.logger.debug(`Template directory: ${join(__dirname, '..', '..', '..', 'dist', 'templates', 'email')}`);
    this.logger.debug(`Welcome template exists: ${existsSync(join(__dirname, '..', '..', '..', 'dist', 'templates', 'email', 'welcome.hbs'))}`);
  }

  async sendWelcomeEmail(email: string, name?: string) {
    if (!this.isEmailEnabled) {
      this.logger.warn('Email service is disabled. Welcome email was not sent.');
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get('SMTP_USER'),
        subject: EMAIL_CONSTANTS.WELCOME.SUBJECT,
        template: EMAIL_CONSTANTS.WELCOME.TEMPLATE,
        context: {
          name: name || EMAIL_CONSTANTS.WELCOME.DEFAULT_NAME,
          baseUrl: this.configService.get('CLIENT_URL'),
        },
      });
      this.logger.log('Welcome email sent successfully');
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
    }
  }
} 