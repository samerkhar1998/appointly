import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// Hashes a password using scrypt with a random 16-byte salt.
// Returns a string in the format "salt_hex:hash_hex".
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

// Verifies a password against a stored scrypt hash (format: "salt_hex:hash_hex").
// Uses timingSafeEqual to prevent timing attacks.
// Returns true if the password matches.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const separatorIndex = storedHash.indexOf(':');
  if (separatorIndex === -1) return false;

  const salt = storedHash.slice(0, separatorIndex);
  const expected = storedHash.slice(separatorIndex + 1);

  try {
    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const expectedBuf = Buffer.from(expected, 'hex');
    if (derived.length !== expectedBuf.length) return false;
    return timingSafeEqual(expectedBuf, derived);
  } catch {
    return false;
  }
}
