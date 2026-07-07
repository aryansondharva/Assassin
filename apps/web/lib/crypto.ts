import { scrypt, randomBytes, timingSafeEqual, createHash } from 'crypto'

// Recommended scrypt parameters for standard security (OWASP / NIST compliant)
const SCRYPT_PARAMS = {
  N: 16384, // Cost factor (power of 2, e.g. 2^14)
  r: 8,     // Block size
  p: 1,     // Parallelization parameter
  keyLen: 64 // Output key length
}

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
 * Hashes a password using scrypt with a unique random salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptPromise(password, salt)
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a password against a stored hash (supports both scrypt and legacy SHA-256 hashes)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Detect legacy SHA-256 hashes (which do not have the 'scrypt:' prefix)
    if (!storedHash.startsWith('scrypt:')) {
      const [salt, originalHash] = storedHash.split(':')
      if (salt && originalHash && salt.length === 32 && originalHash.length === 64) {
        const hashToCompare = createHash('sha256').update(password + salt).digest('hex')
        // Constant-time comparison for legacy verification
        const hashToCompareBuffer = Buffer.from(hashToCompare, 'hex')
        const originalHashBuffer = Buffer.from(originalHash, 'hex')
        return timingSafeEqual(hashToCompareBuffer, originalHashBuffer)
      }
      return false
    }

    // Parse scrypt hash components
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false
    const [, salt, originalHash] = parts

    const derivedKey = await scryptPromise(password, salt)
    const originalHashBuffer = Buffer.from(originalHash, 'hex')
    
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(derivedKey, originalHashBuffer)
  } catch (error) {
    console.error('[Verification Error]', error)
    return false
  }
}

/**
 * Utility to check if a password hash is using the legacy algorithm and needs rehashing
 */
export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith('scrypt:')
}
