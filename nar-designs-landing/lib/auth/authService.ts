import { getKv, generateId, getCurrentTimestamp } from "../kv/kv.ts";
import type { User, Session, LoginRequest, LoginResponse } from "../../types/cms/content.ts";

export class AuthService {
  private async getKv() {
    return await getKv();
  }

  // Hash password (simple implementation - in production use bcrypt or similar)
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "nar_designs_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  // Create initial admin user (call this once to set up)
  async createAdminUser(username: string, email: string, password: string): Promise<User> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    
    const user: User = {
      id: generateId(),
      username,
      email,
      passwordHash: await this.hashPassword(password),
      role: 'admin',
      createdAt: now,
    };

    const result = await kv.atomic()
      .set(["users", user.id], user)
      .set(["users_by_username", username], user.id)
      .set(["users_by_email", email], user.id)
      .commit();

    if (!result.ok) {
      throw new Error("Failed to create admin user");
    }

    return user;
  }

  // Authenticate user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const kv = await this.getKv();
    
    // Find user by username
    const userIdResult = await kv.get<string>(["users_by_username", credentials.username]);
    if (!userIdResult.value) {
      return { success: false, error: "Invalid credentials" };
    }

    const userResult = await kv.get<User>(["users", userIdResult.value]);
    if (!userResult.value) {
      return { success: false, error: "User not found" };
    }

    const user = userResult.value;

    // Verify password
    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    // Create session
    const session = await this.createSession(user.id);

    // Update last login
    await kv.set(["users", user.id], {
      ...user,
      lastLogin: getCurrentTimestamp(),
    });

    const { passwordHash, ...safeUser } = user;
    return {
      success: true,
      token: session.token,
      user: safeUser,
    };
  }

  // Create session
  private async createSession(userId: string): Promise<Session> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: Session = {
      id: generateId(),
      userId,
      token: this.generateToken(),
      expiresAt,
      createdAt: now,
    };

    await kv.set(["sessions", session.token], session);
    return session;
  }

  // Generate secure token
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate session
  async validateSession(token: string): Promise<User | null> {
    const kv = await this.getKv();
    
    const sessionResult = await kv.get<Session>(["sessions", token]);
    if (!sessionResult.value) return null;

    const session = sessionResult.value;
    
    // Check if session is expired
    if (session.expiresAt < getCurrentTimestamp()) {
      await kv.delete(["sessions", token]);
      return null;
    }

    // Get user
    const userResult = await kv.get<User>(["users", session.userId]);
    return userResult.value || null;
  }

  // Logout
  async logout(token: string): Promise<void> {
    const kv = await this.getKv();
    await kv.delete(["sessions", token]);
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const kv = await this.getKv();
    const result = await kv.get<User>(["users", id]);
    return result.value;
  }

  // Check if any admin users exist (for setup)
  async hasAdminUsers(): Promise<boolean> {
    const kv = await this.getKv();
    for await (const entry of kv.list<User>({ prefix: ["users"] })) {
      if (entry.value.role === 'admin') {
        return true;
      }
    }
    return false;
  }
}