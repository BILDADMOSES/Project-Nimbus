import bcrypt from 'bcryptjs';

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The plain text password to hash.
 * @param {number} saltRounds - The number of salt rounds to use (default: 10).
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  try {
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('Error hashing password:', errorMessage);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compares a plain text password with a hashed password.
 * @param {string} password - The plain text password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves with true if the passwords match, false otherwise.
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch: boolean = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('Error comparing passwords:', errorMessage);
    throw new Error('Failed to compare passwords');
  }
}

/**
 * Generates a salt using bcrypt.
 * @param {number} rounds - The number of rounds to use (default: 10).
 * @returns {Promise<string>} A promise that resolves with the generated salt.
 */
export async function generateSalt(rounds: number = 10): Promise<string> {
  try {
    const salt: string = await bcrypt.genSalt(rounds);
    return salt;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('Error generating salt:', errorMessage);
    throw new Error('Failed to generate salt');
  }
}

/**
 * Hashes a password using a provided salt.
 * @param {string} password - The plain text password to hash.
 * @param {string} salt - The salt to use for hashing.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  try {
    const hashedPassword: string = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('Error hashing password with salt:', errorMessage);
    throw new Error('Failed to hash password with provided salt');
  }
}