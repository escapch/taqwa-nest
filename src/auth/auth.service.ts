import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { MailerService } from '../mailer/mailer.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) { }

  async register(
    email: string,
    password: string,
    timezone?: string,
    name?: string,
  ) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create(
      email,
      hashedPassword,
      timezone || 'UTC',
      name,
    );
    return this.generateToken(String(user._id), user.email);
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.generateToken(String(user._id), user.email);

    return {
      ...token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        registeredAt: user.registeredAt,
        isAdmin: user.isAdmin,
      },
    };
  }

  async loginWithGoogle(idToken: string) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new BadRequestException('Google-вход не настроен на сервере');
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Недействительный токен Google');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Недействительный токен Google');
    }

    const user = await this.userService.findOrCreateByGoogle({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
    });

    const token = this.generateToken(String(user._id), user.email);
    return {
      ...token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        registeredAt: user.registeredAt,
        isAdmin: user.isAdmin,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    // Не раскрываем, существует ли аккаунт — отвечаем одинаково в обоих случаях.
    if (!user) return { message: 'Если аккаунт существует, письмо отправлено' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.userService.setResetPasswordToken(String(user._id), tokenHash, expires);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.mailerService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'Если аккаунт существует, письмо отправлено' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userService.findByResetTokenHash(tokenHash);
    if (!user) throw new BadRequestException('Ссылка недействительна или устарела');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.resetPassword(String(user._id), hashedPassword);

    return { message: 'Пароль успешно изменён' };
  }

  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
