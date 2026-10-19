import bcrypt from 'bcryptjs';

// Safe lazy loading of argon2 to support both native and serverless environments
let argon2 = null;
try {
  const argonModule = await import('argon2');
  argon2 = argonModule.default || argonModule;
} catch (err) {
  // Argon2 native binary unavailable in serverless environment; pure-JS bcryptjs will be used
}

/**
 * Robust password hashing utility supporting both Argon2 and bcrypt fallback
 */
export const hashPassword = async (password) => {
  if (argon2) {
    try {
      return await argon2.hash(password);
    } catch (err) {
      console.warn('[authUtils] Argon2 hashing failed, falling back to bcryptjs:', err.message);
    }
  }
  return await bcrypt.hash(password, 10);
};

/**
 * Robust password verification utility supporting Argon2 and bcrypt hashes
 */
export const verifyPassword = async (hash, password) => {
  if (!hash || !password) return false;

  // If hash is Argon2 format ($argon2...)
  if (hash.startsWith('$argon2')) {
    if (argon2) {
      try {
        return await argon2.verify(hash, password);
      } catch (err) {
        console.error('[authUtils] Argon2 verify error:', err.message);
        return false;
      }
    } else {
      console.warn('[authUtils] Argon2 hash encountered but argon2 binary is not available.');
      return false;
    }
  }

  // Otherwise check standard bcrypt format ($2a$ or $2b$)
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error('[authUtils] bcrypt verify error:', err.message);
    return false;
  }
};
