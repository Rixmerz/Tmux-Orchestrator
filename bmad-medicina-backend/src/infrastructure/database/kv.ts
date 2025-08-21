import { logger } from "../logging/logger.ts";

let kv: Deno.Kv;

export async function initializeKV(): Promise<void> {
  try {
    kv = await Deno.openKv();
    logger.info("✅ DenoKV connection established");
  } catch (error) {
    logger.error("❌ Failed to connect to DenoKV", error);
    throw error;
  }
}

export function getKV(): Deno.Kv {
  if (!kv) {
    throw new Error("DenoKV not initialized. Call initializeKV() first.");
  }
  return kv;
}

// Database key patterns for different entities
export const KV_KEYS = {
  // Users
  USER: (id: string) => ["users", id],
  USER_BY_EMAIL: (email: string) => ["users_by_email", email],
  USER_BY_PHONE: (phone: string) => ["users_by_phone", phone],

  // Medications
  MEDICATION: (id: string) => ["medications", id],
  MEDICATION_BY_CODE: (code: string) => ["medications_by_code", code],
  MEDICATION_INTERACTIONS: (
    medicationId: string,
  ) => ["medication_interactions", medicationId],

  // Adherence tracking
  ADHERENCE_SCHEDULE: (
    userId: string,
    medicationId: string,
  ) => ["adherence_schedules", userId, medicationId],
  ADHERENCE_RECORD: (
    userId: string,
    medicationId: string,
    date: string,
  ) => ["adherence_records", userId, medicationId, date],

  // Stock alerts
  STOCK_ALERT: (
    pharmacyId: string,
    medicationId: string,
  ) => ["stock_alerts", pharmacyId, medicationId],
  PHARMACY: (id: string) => ["pharmacies", id],

  // Notifications
  NOTIFICATION: (id: string) => ["notifications", id],
  USER_NOTIFICATIONS: (userId: string) => ["user_notifications", userId],

  // Sessions and auth
  SESSION: (sessionId: string) => ["sessions", sessionId],
  REFRESH_TOKEN: (tokenId: string) => ["refresh_tokens", tokenId],

  // Audit logs (Ley 19.628 compliance)
  AUDIT_LOG: (id: string) => ["audit_logs", id],
  USER_AUDIT_LOGS: (userId: string) => ["user_audit_logs", userId],
};

// Utility functions for common operations
export async function kvSet<T>(
  key: Deno.KvKey,
  value: T,
  options?: { expireIn?: number },
): Promise<void> {
  try {
    await kv.set(key, value, options);
    logger.debug(`KV SET: ${JSON.stringify(key)}`);
  } catch (error) {
    logger.error(`KV SET ERROR: ${JSON.stringify(key)}`, error);
    throw error;
  }
}

export async function kvGet<T>(key: Deno.KvKey): Promise<T | null> {
  try {
    const result = await kv.get<T>(key);
    logger.debug(
      `KV GET: ${JSON.stringify(key)} - Found: ${result.value !== null}`,
    );
    return result.value;
  } catch (error) {
    logger.error(`KV GET ERROR: ${JSON.stringify(key)}`, error);
    throw error;
  }
}

export async function kvDelete(key: Deno.KvKey): Promise<void> {
  try {
    await kv.delete(key);
    logger.debug(`KV DELETE: ${JSON.stringify(key)}`);
  } catch (error) {
    logger.error(`KV DELETE ERROR: ${JSON.stringify(key)}`, error);
    throw error;
  }
}

export async function kvList<T>(prefix: Deno.KvKey): Promise<T[]> {
  try {
    const results: T[] = [];
    for await (const entry of kv.list<T>({ prefix })) {
      results.push(entry.value);
    }
    logger.debug(
      `KV LIST: ${JSON.stringify(prefix)} - Found: ${results.length} items`,
    );
    return results;
  } catch (error) {
    logger.error(`KV LIST ERROR: ${JSON.stringify(prefix)}`, error);
    throw error;
  }
}
