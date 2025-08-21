// Deno KV database configuration
let kv: Deno.Kv;

export async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    // Use environment variable for production, fallback to local file for development
    const kvPath = Deno.env.get("DENO_KV_PATH") || "./data.db";
    kv = await Deno.openKv(kvPath);
  }
  return kv;
}

// Helper function to generate unique IDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): Date {
  return new Date();
}

export default getKv;