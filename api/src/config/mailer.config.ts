import { registerAs } from '@nestjs/config';
import { parseNodeEnv, Environment } from '../Environment';

export interface MailerConfig {
  transport?: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  defaults?: {
    from: string;
  };
  azure?: {
    connectionString: string;
    senderAddress: string;
  };
}

export default registerAs('mailer', (): MailerConfig => {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV ?? '');
  const isDevelopment =
    nodeEnv === Environment.Development || nodeEnv === Environment.CI;

  const mailerConfig: MailerConfig = {};

  if (isDevelopment) {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;

    mailerConfig.transport = {
      host: process.env.MAIL_HOST ?? 'localhost',
      port: parseInt(process.env.MAIL_PORT ?? '2525', 10),
      secure: process.env.MAIL_SECURE === 'true',
      auth:
        mailUser && mailPass ? { user: mailUser, pass: mailPass } : undefined,
    };

    mailerConfig.defaults = {
      from: process.env.MAIL_FROM ?? 'noreply@local.local',
    };
  } else {
    const connectionString = process.env.AZURE_COMM_EMAIL_CONN_STRING;
    const senderAddress = process.env.AZURE_COMM_EMAIL_SENDER;

    if (!connectionString || !senderAddress) {
      throw new Error(
        'AZURE_COMM_EMAIL_CONN_STRING and AZURE_COMM_EMAIL_SENDER required for test/production',
      );
    }

    mailerConfig.azure = { connectionString, senderAddress };
  }

  return mailerConfig;
});
