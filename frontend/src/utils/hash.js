/**
 * hash.js — In-browser SHA-256 hashing utility.
 *
 * Uses the Web Crypto API (built into all modern browsers).
 * No server or extra dependencies required.
 *
 * @param {ArrayBuffer} buffer - Raw file bytes read via FileReader
 * @returns {Promise<string>} - 0x-prefixed 32-byte hex string (bytes32 format)
 */
export async function sha256ToBytes32(buffer) {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

/**
 * Reads a File object as an ArrayBuffer.
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convenience: takes a File, returns its bytes32 SHA-256 hash.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function hashFile(file) {
  const buffer = await readFileAsBuffer(file);
  return sha256ToBytes32(buffer);
}

/**
 * Shortens a wallet address for display, e.g. 0x1234...abcd
 * @param {string} address
 * @returns {string}
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a Unix timestamp (BigInt or number) as a readable date string.
 * @param {bigint|number} ts
 * @returns {string}
 */
export function formatTimestamp(ts) {
  return new Date(Number(ts) * 1000).toLocaleString();
}

/**
 * Formats a token amount (in 18-decimal wei) to a human-readable number.
 * @param {bigint} amount - raw wei value
 * @param {number} decimals - default 18
 * @returns {string}
 */
export function formatTokenAmount(amount, decimals = 18) {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  return whole.toLocaleString();
}

