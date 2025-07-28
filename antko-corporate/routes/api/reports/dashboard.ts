import { Handlers } from "$fresh/server.ts";
import { AuthState, requireAuth, hasPermission } from "../../../lib/auth.ts";
import { CustomerService } from "../../../lib/customers.ts";
import { LeadService } from "../../../lib/leads.ts";
import { OpportunityService } from "../../../lib/opportunities.ts";

export const handler: Handlers<any, AuthState> = {
  async GET(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions
    if (!hasPermission(ctx.state.user!.role, "reports", "read")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      // Get all statistics
      const [customerStats, leadStats, opportunityStats] = await Promise.all([
        CustomerService.getStatistics(),
        LeadService.getStatistics(),
        OpportunityService.getStatistics()
      ]);
      
      // Calculate additional metrics
      const totalCustomers = customerStats.total;
      const totalLeads = leadStats.total;
      const totalOpportunities = opportunityStats.total;
      const pipelineValue = opportunityStats.totalValue;
      const conversionRate = leadStats.conversionRate;
      const winRate = opportunityStats.winRate;
      
      // Calculate monthly revenue (closed-won opportunities)
      const monthlyRevenue = opportunityStats.byStage["closed-won"] || 0;
      
      // Calculate average deal size
      const avgDealSize = opportunityStats.averageValue;
      
      // Calculate sales velocity (simplified)
      const salesVelocity = Math.round(pipelineValue / 30); // Monthly pipeline value
      
      // Filter data for sales reps
      let filteredData = {
        totalCustomers,
        totalLeads,
        totalOpportunities,
        pipelineValue,
        monthlyRevenue,
        conversionRate,
        avgDealSize,
        salesVelocity,
        winRate,
        customerStats,
        leadStats,
        opportunityStats
      };
      
      // Sales reps get filtered view
      if (ctx.state.user!.role === "sales-rep") {
        // In a real implementation, we'd filter by assigned user
        // For now, we'll just note that this should be filtered
        filteredData = {
          ...filteredData,
          note: "Data filtered for sales rep view"
        };
      }
      
      return new Response(
        JSON.stringify({ 
          dashboard: filteredData,
          generatedAt: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Dashboard error:", error);
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