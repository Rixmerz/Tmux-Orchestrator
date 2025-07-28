import { create, getNumericDate, Payload, verify } from "@djwt/mod.ts";
import { config } from "../config/config.ts";
import { User } from "../../domain/entities/User.ts";
import { logger } from "../logging/logger.ts";

export interface JwtPayload extends Payload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

// Generate crypto key for JWT signing
async function getJwtKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(
    config.jwtSecret.padEnd(64, "0").slice(0, 64),
  );
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function generateTokenPair(
  user: User,
  sessionId: string,
): Promise<TokenPair> {
  const key = await getJwtKey();
  const now = Math.floor(Date.now() / 1000);
  const accessTokenExpiry = now + (15 * 60); // 15 minutes
  const refreshTokenExpiry = now + (7 * 24 * 60 * 60); // 7 days

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    iat: now,
    exp: accessTokenExpiry,
  };

  const refreshPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
    iat: now,
    exp: refreshTokenExpiry,
  };

  const accessToken = await create(
    { alg: "HS256", typ: "JWT" },
    payload,
    key,
  );

  const refreshToken = await create(
    { alg: "HS256", typ: "JWT" },
    refreshPayload,
    key,
  );

  logger.info(`Tokens generated for user: ${user.email}`);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: "Bearer",
  };
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const key = await getJwtKey();
    const payload = await verify(token, key) as JwtPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      logger.warn(`Expired token for user: ${payload.email}`);
      return null;
    }

    return payload;
  } catch (error) {
    logger.warn(`Invalid token verification: ${error.message}`);
    return null;
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenPair | null> {
  try {
    const payload = await verifyToken(refreshToken);
    if (!payload) return null;

    // Generate new token pair
    const user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    } as User;

    return await generateTokenPair(user, payload.sessionId);
  } catch (error) {
    logger.error(`Token refresh failed: ${error.message}`);
    return null;
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Generate session ID
export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
