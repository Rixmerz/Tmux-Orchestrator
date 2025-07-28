import { Handlers } from "$fresh/server.ts";
import { AuthState, requireAuth, hasPermission } from "../../../lib/auth.ts";
import kv from "../../../lib/kv-simple.ts";

interface SystemSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  timezone: string;
  currency: string;
  defaultSalesStage: string;
  leadSources: string[];
  opportunityStages: string[];
  industries: string[];
  companySizes: string[];
  emailIntegration: boolean;
  notificationsEnabled: boolean;
  autoAssignLeads: boolean;
  requireApproval: boolean;
  backupEnabled: boolean;
  auditLogging: boolean;
}

export const handler: Handlers<any, AuthState> = {
  async GET(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions
    if (!hasPermission(ctx.state.user!.role, "settings", "read")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const result = await kv.get<SystemSettings>(["settings", "system"]);
      
      const defaultSettings: SystemSettings = {
        companyName: "Antko Corporate",
        companyEmail: "info@antko.com",
        companyPhone: "+1 (555) 123-4567",
        companyAddress: "123 Business St, Corporate City, CC 12345",
        timezone: "America/New_York",
        currency: "USD",
        defaultSalesStage: "prospecting",
        leadSources: ["website", "referral", "cold-call", "email", "social", "trade-show", "other"],
        opportunityStages: ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"],
        industries: ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Government", "Other"],
        companySizes: ["1-10", "11-50", "51-200", "201-500", "500+"],
        emailIntegration: false,
        notificationsEnabled: true,
        autoAssignLeads: false,
        requireApproval: false,
        backupEnabled: true,
        auditLogging: true
      };
      
      const settings = result.value || defaultSettings;
      
      return new Response(
        JSON.stringify({ settings }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Get settings error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  
  async PUT(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions - only admins can update settings
    if (!hasPermission(ctx.state.user!.role, "settings", "write")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const updates = await req.json();
      
      // Get current settings
      const currentResult = await kv.get<SystemSettings>(["settings", "system"]);
      const currentSettings = currentResult.value || {};
      
      // Merge updates with current settings
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.state.user!.id
      };
      
      // Save settings
      await kv.set(["settings", "system"], updatedSettings);
      
      // Log the settings change
      await kv.set(["audit", "settings", crypto.randomUUID()], {
        action: "SETTINGS_UPDATED",
        userId: ctx.state.user!.id,
        changes: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ settings: updatedSettings }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Update settings error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};