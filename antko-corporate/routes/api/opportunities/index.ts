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
      const url = new URL(req.url);
      const customerId = url.searchParams.get("customerId");
      const assignedTo = url.searchParams.get("assignedTo");
      const stage = url.searchParams.get("stage");
      const minAmount = url.searchParams.get("minAmount");
      const maxAmount = url.searchParams.get("maxAmount");
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      
      let opportunities = await OpportunityService.list({
        customerId: customerId || undefined,
        assignedTo: assignedTo || undefined,
        stage: stage || undefined,
        minAmount: minAmount ? parseInt(minAmount) : undefined,
        maxAmount: maxAmount ? parseInt(maxAmount) : undefined,
        limit,
        offset,
      });
      
      // Sales reps can only see their own opportunities
      if (ctx.state.user!.role === "sales-rep") {
        opportunities = opportunities.filter(opp => 
          opp.assignedTo === ctx.state.user!.id
        );
      }
      
      return new Response(
        JSON.stringify({ opportunities }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Get opportunities error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  
  async POST(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions
    if (!hasPermission(ctx.state.user!.role, "opportunities", "write")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const opportunityData = await req.json();
      
      // Validate required fields
      const requiredFields = [
        "title", "customerId", "amount", "probability", 
        "stage", "expectedCloseDate", "description"
      ];
      
      for (const field of requiredFields) {
        if (!opportunityData[field]) {
          return new Response(
            JSON.stringify({ error: `${field} is required` }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
      
      // Validate amount
      if (opportunityData.amount < 0) {
        return new Response(
          JSON.stringify({ error: "Amount must be positive" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Validate probability
      if (opportunityData.probability < 0 || opportunityData.probability > 100) {
        return new Response(
          JSON.stringify({ error: "Probability must be between 0 and 100" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Set defaults
      opportunityData.products = opportunityData.products || [];
      
      // Set assigned salesperson
      if (!opportunityData.assignedTo) {
        opportunityData.assignedTo = ctx.state.user!.id;
      }
      
      // Parse date
      opportunityData.expectedCloseDate = new Date(opportunityData.expectedCloseDate);
      
      const opportunity = await OpportunityService.create(opportunityData);
      
      return new Response(
        JSON.stringify({ opportunity }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Create opportunity error:", error);
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