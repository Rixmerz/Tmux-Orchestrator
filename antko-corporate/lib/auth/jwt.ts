/**
 * ENTERPRISE JWT AUTHENTICATION SYSTEM
 * Implements secure JWT tokens with refresh mechanism and MFA support
 */

import { create, verify, decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { crypto } from "https://deno.land/std@0.216.0/crypto/mod.ts";
import secureKv from "../kv.ts";

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: "admin" | "sales-manager" | "sales-rep";
  name: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
  mfa_verified?: boolean;
  session_id: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed: Date;
  ipAddress: string;
  userAgent: string;
  revoked: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  active: boolean;
}

class JWTAuthService {
  private readonly JWT_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 3600; // 7 days
  private readonly SESSION_PREFIX = ["sessions"];
  private readonly REFRESH_PREFIX = ["refresh_tokens"];
  private readonly REVOKED_PREFIX = ["revoked_tokens"];

  constructor() {
    this.JWT_SECRET = Deno.env.get("JWT_SECRET") || "enterprise-jwt-secret-change-in-production";
    if (this.JWT_SECRET === "enterprise-jwt-secret-change-in-production") {
      console.warn("⚠️  WARNING: Using default JWT secret! Set JWT_SECRET environment variable");
    }
  }

  private async getKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.JWT_SECRET);
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }

  async generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp" | "jti">): Promise<string> {
    const key = await this.getKey();
    const now = Math.floor(Date.now() / 1000);
    
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.ACCESS_TOKEN_EXPIRY,
      jti: crypto.randomUUID()
    };

    return await create({ alg: "HS256", typ: "JWT" }, fullPayload, key);
  }

  async generateRefreshToken(userId: string, ipAddress: string, userAgent: string): Promise<RefreshToken> {
    const refreshToken: RefreshToken = {
      id: crypto.randomUUID(),
      userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000),
      createdAt: new Date(),
      lastUsed: new Date(),
      ipAddress,
      userAgent,
      revoked: false
    };

    await secureKv.set([...this.REFRESH_PREFIX, refreshToken.id], refreshToken, { userId });
    return refreshToken;
  }

  async createSession(userId: string, email: string, role: string, name: string, ipAddress: string, userAgent: string): Promise<UserSession> {
    const sessionId = crypto.randomUUID();
    
    // Generate tokens
    const accessToken = await this.generateAccessToken({
      sub: userId,
      email,
      role: role as any,
      name,
      session_id: sessionId
    });

    const refreshToken = await this.generateRefreshToken(userId, ipAddress, userAgent);

    const session: UserSession = {
      id: sessionId,
      userId,
      accessToken,
      refreshToken: refreshToken.token,
      expiresAt: new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY * 1000),
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      active: true
    };

    await secureKv.set([...this.SESSION_PREFIX, sessionId], session, { userId });
    
    // Audit log
    await secureKv.set(
      ["audit", "auth", crypto.randomUUID()],
      {
        event: "SESSION_CREATED",
        userId,
        sessionId,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      },
      { userId }
    );

    return session;
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const key = await this.getKey();
      const payload = await verify(token, key) as JWTPayload;

      // Check if token is revoked
      const revokedCheck = await secureKv.get([...this.REVOKED_PREFIX, payload.jti]);
      if (revokedCheck.value) {
        return null;
      }

      // Check if session is still active
      const session = await secureKv.get<UserSession>([...this.SESSION_PREFIX, payload.session_id]);
      if (!session.value || !session.value.active) {
        return null;
      }

      // Update last activity
      await secureKv.set([...this.SESSION_PREFIX, payload.session_id], {
        ...session.value,
        lastActivity: new Date()
      }, { userId: payload.sub });

      return payload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  }

  async refreshAccessToken(refreshTokenId: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshToken = await secureKv.get<RefreshToken>([...this.REFRESH_PREFIX, refreshTokenId]);
    
    if (!refreshToken.value || refreshToken.value.revoked || refreshToken.value.expiresAt < new Date()) {
      return null;
    }

    // Get user info for new token
    const session = await secureKv.get<UserSession>([...this.SESSION_PREFIX, refreshToken.value.userId]);
    if (!session.value) {
      return null;
    }

    // Generate new access token
    const newAccessToken = await this.generateAccessToken({
      sub: refreshToken.value.userId,
      email: "", // Will be populated from user data
      role: "sales-rep", // Will be populated from user data
      name: "", // Will be populated from user data
      session_id: session.value.id
    });

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(
      refreshToken.value.userId,
      refreshToken.value.ipAddress,
      refreshToken.value.userAgent
    );

    // Revoke old refresh token
    await secureKv.set([...this.REFRESH_PREFIX, refreshTokenId], {
      ...refreshToken.value,
      revoked: true
    }, { userId: refreshToken.value.userId });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token
    };
  }

  async revokeToken(jti: string, userId: string): Promise<void> {
    await secureKv.set([...this.REVOKED_PREFIX, jti], {
      jti,
      revokedAt: new Date().toISOString(),
      revokedBy: userId
    }, { userId });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await secureKv.get<UserSession>([...this.SESSION_PREFIX, sessionId]);
    if (session.value) {
      await secureKv.set([...this.SESSION_PREFIX, sessionId], {
        ...session.value,
        active: false
      }, { userId });

      // Audit log
      await secureKv.set(
        ["audit", "auth", crypto.randomUUID()],
        {
          event: "SESSION_REVOKED",
          userId,
          sessionId,
          timestamp: new Date().toISOString()
        },
        { userId }
      );
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const allSessions = await secureKv.list<UserSession>({ prefix: this.SESSION_PREFIX });
    
    for (const session of allSessions) {
      if (session.userId === userId && session.active) {
        await this.revokeSession(session.id, userId);
      }
    }
  }

  async getActiveSessions(userId: string): Promise<UserSession[]> {
    const allSessions = await secureKv.list<UserSession>({ prefix: this.SESSION_PREFIX });
    return allSessions.filter(session => session.userId === userId && session.active);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const allSessions = await secureKv.list<UserSession>({ prefix: this.SESSION_PREFIX });
    const now = new Date();
    
    for (const session of allSessions) {
      if (session.expiresAt < now) {
        await this.revokeSession(session.id, session.userId);
      }
    }
  }
}

export const jwtAuthService = new JWTAuthService();
export default jwtAuthService;