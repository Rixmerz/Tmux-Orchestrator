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
      const { id } = ctx.params;
      const opportunity = await OpportunityService.findById(id);
      
      if (!opportunity) {
        return new Response(
          JSON.stringify({ error: "Opportunity not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Sales reps can only see their own opportunities
      if (ctx.state.user!.role === "sales-rep" && opportunity.assignedTo !== ctx.state.user!.id) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ opportunity }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Get opportunity error:", error);
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
      const { id } = ctx.params;
      const updates = await req.json();
      
      // Check if opportunity exists
      const existingOpportunity = await OpportunityService.findById(id);
      if (!existingOpportunity) {
        return new Response(
          JSON.stringify({ error: "Opportunity not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Sales reps can only update their own opportunities
      if (ctx.state.user!.role === "sales-rep" && existingOpportunity.assignedTo !== ctx.state.user!.id) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Validate fields if being updated
      if (updates.amount !== undefined && updates.amount < 0) {
        return new Response(
          JSON.stringify({ error: "Amount must be positive" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      if (updates.probability !== undefined && (updates.probability < 0 || updates.probability > 100)) {
        return new Response(
          JSON.stringify({ error: "Probability must be between 0 and 100" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Parse date if provided
      if (updates.expectedCloseDate) {
        updates.expectedCloseDate = new Date(updates.expectedCloseDate);
      }
      
      const opportunity = await OpportunityService.update(id, updates);
      
      return new Response(
        JSON.stringify({ opportunity }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Update opportunity error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  
  async DELETE(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions
    if (!hasPermission(ctx.state.user!.role, "opportunities", "delete")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const { id } = ctx.params;
      
      // Check if opportunity exists
      const existingOpportunity = await OpportunityService.findById(id);
      if (!existingOpportunity) {
        return new Response(
          JSON.stringify({ error: "Opportunity not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      const success = await OpportunityService.delete(id);
      
      if (!success) {
        return new Response(
          JSON.stringify({ error: "Failed to delete opportunity" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ message: "Opportunity deleted successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Delete opportunity error:", error);
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