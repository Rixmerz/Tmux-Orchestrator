import { Handlers } from "$fresh/server.ts";
import { AuthState, requireAuth, hasPermission } from "../../../lib/auth.ts";
import { OpportunityService } from "../../../lib/opportunities.ts";

export const handler: Handlers<any, AuthState> = {
  async GET(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions
    if (!hasPermission(ctx.state.user!.role, "opportunities", "read")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const pipeline = await OpportunityService.getPipeline();
      
      // Filter for sales reps - only show their opportunities
      if (ctx.state.user!.role === "sales-rep") {
        const userId = ctx.state.user!.id;
        for (const stage in pipeline) {
          pipeline[stage].opportunities = pipeline[stage].opportunities.filter(
            opp => opp.assignedTo === userId
          );
          pipeline[stage].count = pipeline[stage].opportunities.length;
          pipeline[stage].totalValue = pipeline[stage].opportunities.reduce(
            (sum, opp) => sum + opp.amount, 0
          );
        }
      }
      
      return new Response(
        JSON.stringify({ pipeline }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Get pipeline error:", error);
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