import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    this.fromEmail = user || 'noreply@taqwa.app';
    this.transporter =
      user && pass
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
          })
        : null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    if (!this.transporter) {
      this.logger.warn(
        `GMAIL_USER/GMAIL_APP_PASSWORD не заданы — письмо для ${to} не отправлено. Ссылка: ${resetUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `Taqwa <${this.fromEmail}>`,
        to,
        subject: 'Восстановление пароля — Taqwa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Восстановление пароля</h2>
            <p>Вы запросили сброс пароля для вашего аккаунта в Taqwa.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;">
                Сбросить пароль
              </a>
            </p>
            <p>Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Не удалось отправить письмо на ${to}: ${err}`);
      throw new Error('Не удалось отправить письмо');
    }
  }
}
