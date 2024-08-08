import * as crypto from 'crypto';

export class Crypt {
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  public static verifyPassword(storedHash: string, password: string): boolean {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return hash === originalHash;
  }
}
