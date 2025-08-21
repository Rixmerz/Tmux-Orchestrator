export interface Config {
  port: number;
  environment: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  logLevel: string;
  encryptionKey: string;
  chileanPharmacyApiUrl: string;
  chileanPharmacyApiKey: string;
  smsApiUrl: string;
  smsApiKey: string;
  emailSmtpHost: string;
  emailSmtpPort: number;
  emailUser: string;
  emailPassword: string;
}

export const config: Config = {
  port: parseInt(Deno.env.get("PORT") || "8080"),
  environment: Deno.env.get("ENVIRONMENT") || "development",
  jwtSecret: Deno.env.get("JWT_SECRET") ||
    "your-super-secret-jwt-key-change-in-production",
  jwtExpiresIn: Deno.env.get("JWT_EXPIRES_IN") || "24h",
  corsOrigins: (Deno.env.get("CORS_ORIGINS") ||
    "http://localhost:8000,http://localhost:3000").split(","),
  logLevel: Deno.env.get("LOG_LEVEL") || "info",
  encryptionKey: Deno.env.get("ENCRYPTION_KEY") ||
    "your-aes-256-encryption-key-32-chars",
  chileanPharmacyApiUrl: Deno.env.get("CHILEAN_PHARMACY_API_URL") ||
    "https://api.farmacias.cl",
  chileanPharmacyApiKey: Deno.env.get("CHILEAN_PHARMACY_API_KEY") || "",
  smsApiUrl: Deno.env.get("SMS_API_URL") || "https://api.sms.cl",
  smsApiKey: Deno.env.get("SMS_API_KEY") || "",
  emailSmtpHost: Deno.env.get("EMAIL_SMTP_HOST") || "smtp.gmail.com",
  emailSmtpPort: parseInt(Deno.env.get("EMAIL_SMTP_PORT") || "587"),
  emailUser: Deno.env.get("EMAIL_USER") || "",
  emailPassword: Deno.env.get("EMAIL_PASSWORD") || "",
};
