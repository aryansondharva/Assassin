import { scrypt, randomBytes, timingSafeEqual, createHash } from 'crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64
};

function scryptPromise(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_PARAMS.keyLen,
      {
        cost: SCRYPT_PARAMS.N,
        blockSize: SCRYPT_PARAMS.r,
        parallelization: SCRYPT_PARAMS.p,
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
}

/**
 * Hash a password using scrypt with a unique random salt
 */
export async function hash_password(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptPromise(password, salt);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a hash (supports both scrypt and legacy SHA-256)
 */
export async function verify_password(password: string, hash: string): Promise<boolean> {
  try {
    // Check if it's the old SHA-256 hash format
    if (!hash.startsWith('scrypt:')) {
      const [salt, originalHash] = hash.split(':');
      if (salt && originalHash && salt.length === 32 && originalHash.length === 64) {
        const hashToCompare = createHash('sha256').update(password + salt).digest('hex');
        const hashToCompareBuffer = Buffer.from(hashToCompare, 'hex');
        const originalHashBuffer = Buffer.from(originalHash, 'hex');
        return timingSafeEqual(hashToCompareBuffer, originalHashBuffer);
      }
      return false;
    }

    const parts = hash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;

    const derivedKey = await scryptPromise(password, salt);
    const originalHashBuffer = Buffer.from(originalHash, 'hex');
    return timingSafeEqual(derivedKey, originalHashBuffer);
  } catch (error) {
    return false;
  }
}


/**
 * Generate a random session token
 */
export function generate_session_token(): string {
  return randomBytes(32).toString('hex');
}

