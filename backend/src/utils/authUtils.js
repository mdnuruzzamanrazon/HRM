import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

/**
 * Robust password hashing utility supporting both Argon2 and bcrypt fallback
 */
export const hashPassword = async (password) => {
  try {
    return await argon2.hash(password);
  } catch (err) {
    console.warn('[authUtils] Argon2 hashing failed, falling back to bcryptjs:', err.message);
    return await bcrypt.hash(password, 10);
  }
};

/**
 * Robust password verification utility supporting Argon2 and bcrypt hashes
 */
export const verifyPassword = async (hash, password) => {
  if (!hash || !password) return false;

  // If hash is Argon2 format ($argon2...)
  if (hash.startsWith('$argon2')) {
    try {
      return await argon2.verify(hash, password);
    } catch (err) {
      console.error('[authUtils] Argon2 verify error:', err.message);
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
