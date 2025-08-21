import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../../domain/entities/User.ts";
import {
  getKV,
  KV_KEYS,
  kvDelete,
  kvGet,
  kvList,
  kvSet,
} from "../database/kv.ts";
import { hashPassword } from "../security/crypto.ts";
import { logger } from "../logging/logger.ts";

export class UserRepository {
  async create(userData: CreateUserRequest): Promise<User> {
    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(userData.password);

    const user: User = {
      id,
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dateOfBirth: new Date(userData.dateOfBirth),
      gender: userData.gender,
      role: userData.role,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: userData.consentGiven,
      consentDate: new Date(),
      dataRetentionUntil: new Date(
        Date.now() + (7 * 365 * 24 * 60 * 60 * 1000),
      ), // 7 years
    };

    // Store user data with atomic transaction
    const kv = getKV();
    const transaction = kv.atomic()
      .set(KV_KEYS.USER(id), user)
      .set(KV_KEYS.USER_BY_EMAIL(user.email), id)
      .set(KV_KEYS.USER_BY_PHONE(user.phone), id);

    const result = await transaction.commit();
    if (!result.ok) {
      throw new Error("Failed to create user: transaction failed");
    }

    logger.logMedicalEvent("USER_CREATED", id, { role: user.role });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await kvGet<User>(KV_KEYS.USER(id));
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = await kvGet<string>(
      KV_KEYS.USER_BY_EMAIL(email.toLowerCase()),
    );
    if (!userId) return null;
    return this.findById(userId);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const userId = await kvGet<string>(KV_KEYS.USER_BY_PHONE(phone));
    if (!userId) return null;
    return this.findById(userId);
  }

  async update(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) return null;

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };

    // Handle email update
    if (updates.email && updates.email !== existingUser.email) {
      const kv = getKV();
      const transaction = kv.atomic()
        .set(KV_KEYS.USER(id), updatedUser)
        .delete(KV_KEYS.USER_BY_EMAIL(existingUser.email))
        .set(KV_KEYS.USER_BY_EMAIL(updates.email.toLowerCase()), id);

      const result = await transaction.commit();
      if (!result.ok) {
        throw new Error("Failed to update user: email transaction failed");
      }
    } else {
      await kvSet(KV_KEYS.USER(id), updatedUser);
    }

    logger.logMedicalEvent("USER_UPDATED", id);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const kv = getKV();
    const transaction = kv.atomic()
      .delete(KV_KEYS.USER(id))
      .delete(KV_KEYS.USER_BY_EMAIL(user.email))
      .delete(KV_KEYS.USER_BY_PHONE(user.phone));

    const result = await transaction.commit();

    if (result.ok) {
      logger.logMedicalEvent("USER_DELETED", id);
      return true;
    }
    return false;
  }

  async list(
    options?: { role?: string; isActive?: boolean; limit?: number },
  ): Promise<User[]> {
    const users = await kvList<User>(["users"]);

    let filteredUsers = users;

    if (options?.role) {
      filteredUsers = filteredUsers.filter((user) =>
        user.role === options.role
      );
    }

    if (options?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter((user) =>
        user.isActive === options.isActive
      );
    }

    if (options?.limit) {
      filteredUsers = filteredUsers.slice(0, options.limit);
    }

    return filteredUsers;
  }

  async verifyEmail(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const updatedUser = { ...user, emailVerified: true, updatedAt: new Date() };
    await kvSet(KV_KEYS.USER(id), updatedUser);

    logger.logMedicalEvent("EMAIL_VERIFIED", id);
    return true;
  }

  async verifyPhone(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const updatedUser = { ...user, phoneVerified: true, updatedAt: new Date() };
    await kvSet(KV_KEYS.USER(id), updatedUser);

    logger.logMedicalEvent("PHONE_VERIFIED", id);
    return true;
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    const updatedUser = {
      ...user,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };
    await kvSet(KV_KEYS.USER(id), updatedUser);
  }
}
