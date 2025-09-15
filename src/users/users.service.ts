import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { SafeUser, User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly configService: ConfigService) {}

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = this.buildDefaultUser();
    if (user.email !== email) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      return null;
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  getProfile(): SafeUser {
    const { password: _password, ...safeUser } = this.buildDefaultUser();
    return safeUser;
  }

  private buildDefaultUser(): User {
    const email =
      this.configService.getOrThrow<string>('AUTH_USER_EMAIL');
    const name = this.configService.getOrThrow<string>('AUTH_USER_NAME');
    const password =
      this.configService.getOrThrow<string>('AUTH_USER_PASSWORD');

    return {
      id: email,
      email,
      name,
      password,
    };
  }

  private async verifyPassword(
    plain: string,
    stored: string,
  ): Promise<boolean> {
    if (this.looksLikeBcryptHash(stored)) {
      return bcrypt.compare(plain, stored);
    }

    return plain === stored;
  }

  private looksLikeBcryptHash(value: string): boolean {
    return /^\$2[aby]\$/.test(value);
  }
}
