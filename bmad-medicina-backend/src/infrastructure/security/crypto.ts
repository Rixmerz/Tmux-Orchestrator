import { config } from "../config/config.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Password hashing using PBKDF2
export async function hashPassword(
  password: string,
  salt?: Uint8Array,
): Promise<string> {
  const passwordBytes = encoder.encode(password);
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  const hashBytes = new Uint8Array(derivedBits);
  const combined = new Uint8Array(saltBytes.length + hashBytes.length);
  combined.set(saltBytes);
  combined.set(hashBytes, saltBytes.length);

  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    const combined = new Uint8Array(
      atob(hashedPassword).split("").map((c) => c.charCodeAt(0)),
    );
    const salt = combined.slice(0, 16);
    const hash = combined.slice(16);

    const newHashBase64 = await hashPassword(password, salt);
    const newCombined = new Uint8Array(
      atob(newHashBase64).split("").map((c) => c.charCodeAt(0)),
    );
    const newHash = newCombined.slice(16);

    return timingSafeEqual(hash, newHash);
  } catch {
    return false;
  }
}

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// AES-256-GCM encryption for sensitive data (Ley 19.628 compliance)
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes,
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = new Uint8Array(
      atob(encryptedData).split("").map((c) => c.charCodeAt(0)),
    );
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    return decoder.decode(plaintext);
  } catch {
    throw new Error("Decryption failed");
  }
}

// Generate encryption key from config
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBytes = encoder.encode(
    config.encryptionKey.padEnd(32, "0").slice(0, 32),
  );
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Hash data for privacy compliance
export async function hashForPrivacy(data: string): Promise<string> {
  const dataBytes = encoder.encode(data + config.encryptionKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
