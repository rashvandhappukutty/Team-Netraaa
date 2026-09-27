import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculates SHA-256 hash of a file on disk
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
export async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found at path: ${filePath}`));
    }
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Calculates SHA-256 hash from a Buffer in memory
 * @param {Buffer} buffer 
 * @returns {string}
 */
export function calculateBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verifies file integrity by recalculating hash and comparing with recorded hash
 * @param {string} filePath 
 * @param {string} originalHash 
 * @returns {Promise<{ isMatch: boolean, recalculatedHash: string, originalHash: string }>}
 */
export async function verifyFileIntegrity(filePath, originalHash) {
  const recalculatedHash = await calculateFileHash(filePath);
  const isMatch = recalculatedHash.toLowerCase() === originalHash.toLowerCase();
  return {
    isMatch,
    recalculatedHash,
    originalHash
  };
}
