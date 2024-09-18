import { Crypt } from '../utils/crypt';

describe('Crypt', () => {
  it('should generate a hash from a password', () => {
    const password = 'securepassword';
    const hash = Crypt.hashPassword(password);

    expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  });

  it('should verify the correct password', () => {
    const password = 'mypassword';
    const hash = Crypt.hashPassword(password);

    const isPasswordValid = Crypt.verifyPassword(hash, password);

    expect(isPasswordValid).toBe(true);
  });

  it('should not verify an incorrect password', () => {
    const password = 'mypassword';
    const hash = Crypt.hashPassword(password);

    const isPasswordValid = Crypt.verifyPassword(hash, 'wrongpassword');

    expect(isPasswordValid).toBe(false);
  });

  it('should generate different hashes for the same password due to random salt', () => {
    const password = 'samepassword';
    const hash1 = Crypt.hashPassword(password);
    const hash2 = Crypt.hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});
