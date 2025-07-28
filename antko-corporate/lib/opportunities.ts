import { Opportunity } from "./types.ts";
import kv from "./kv-simple.ts";

export class OpportunityService {
  static async create(opportunityData: Omit<Opportunity, "id" | "createdAt" | "updatedAt">): Promise<Opportunity> {
    const opportunity: Opportunity = {
      ...opportunityData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store with multiple indexes for efficient lookups
    await kv.atomic()
      .set(["opportunities", opportunity.id], opportunity)
      .set(["opportunities", "by_customer", opportunity.customerId, opportunity.id], opportunity)
      .set(["opportunities", "by_assigned", opportunity.assignedTo, opportunity.id], opportunity)
      .set(["opportunities", "by_stage", opportunity.stage, opportunity.id], opportunity)
      .commit();
    
    return opportunity;
  }
  
  static async findById(id: string): Promise<Opportunity | null> {
    const result = await kv.get<Opportunity>(["opportunities", id]);
    return result.value;
  }
  
  static async update(id: string, updates: Partial<Omit<Opportunity, "id" | "createdAt">>): Promise<Opportunity | null> {
    const existing = await kv.get<Opportunity>(["opportunities", id]);
    if (!existing.value) return null;
    
    const updated: Opportunity = {
      ...existing.value,
      ...updates,
      updatedAt: new Date(),
    };
    
    // Update all indexes
    const old = existing.value;
    await kv.atomic()
      .check(existing)
      .set(["opportunities", id], updated)
      .delete(["opportunities", "by_customer", old.customerId, id])
      .set(["opportunities", "by_customer", updated.customerId, id], updated)
      .delete(["opportunities", "by_assigned", old.assignedTo, id])
      .set(["opportunities", "by_assigned", updated.assignedTo, id], updated)
      .delete(["opportunities", "by_stage", old.stage, id])
      .set(["opportunities", "by_stage", updated.stage, id], updated)
      .commit();
    
    return updated;
  }
  
  static async delete(id: string): Promise<boolean> {
    const existing = await kv.get<Opportunity>(["opportunities", id]);
    if (!existing.value) return false;
    
    const opp = existing.value;
    const result = await kv.atomic()
      .check(existing)
      .delete(["opportunities", id])
      .delete(["opportunities", "by_customer", opp.customerId, id])
      .delete(["opportunities", "by_assigned", opp.assignedTo, id])
      .delete(["opportunities", "by_stage", opp.stage, id])
      .commit();
    
    return result.ok;
  }
  
  static async list(filters?: {
    customerId?: string;
    assignedTo?: string;
    stage?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    offset?: number;
  }): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    let prefix = ["opportunities"];
    
    // Use appropriate index
    if (filters?.customerId) {
      prefix = ["opportunities", "by_customer", filters.customerId];
    } else if (filters?.assignedTo) {
      prefix = ["opportunities", "by_assigned", filters.assignedTo];
    } else if (filters?.stage) {
      prefix = ["opportunities", "by_stage", filters.stage];
    }
    
    let count = 0;
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    
    for await (const entry of kv.list<Opportunity>({ prefix })) {
      if (count < offset) {
        count++;
        continue;
      }
      
      if (opportunities.length >= limit) {
        break;
      }
      
      const opp = entry.value;
      
      // Apply amount filters
      if (filters?.minAmount && opp.amount < filters.minAmount) {
        continue;
      }
      if (filters?.maxAmount && opp.amount > filters.maxAmount) {
        continue;
      }
      
      // Only include direct entries
      if (entry.key.length === 2 || (entry.key.length === 4 && entry.key[0] === "opportunities")) {
        opportunities.push(opp);
      }
      
      count++;
    }
    
    return opportunities;
  }
  
  static async getPipeline(): Promise<{
    [stage: string]: {
      count: number;
      totalValue: number;
      opportunities: Opportunity[];
    };
  }> {
    const pipeline: { [stage: string]: { count: number; totalValue: number; opportunities: Opportunity[] } } = {
      "prospecting": { count: 0, totalValue: 0, opportunities: [] },
      "qualification": { count: 0, totalValue: 0, opportunities: [] },
      "proposal": { count: 0, totalValue: 0, opportunities: [] },
      "negotiation": { count: 0, totalValue: 0, opportunities: [] },
      "closed-won": { count: 0, totalValue: 0, opportunities: [] },
      "closed-lost": { count: 0, totalValue: 0, opportunities: [] },
    };
    
    for await (const entry of kv.list<Opportunity>({ prefix: ["opportunities"] })) {
      if (entry.key.length !== 2) continue;
      
      const opp = entry.value;
      if (pipeline[opp.stage]) {
        pipeline[opp.stage].count++;
        pipeline[opp.stage].totalValue += opp.amount;
        pipeline[opp.stage].opportunities.push(opp);
      }
    }
    
    return pipeline;
  }
  
  static async getStatistics(): Promise<{
    total: number;
    totalValue: number;
    averageValue: number;
    byStage: Record<string, number>;
    conversionRate: number;
    winRate: number;
  }> {
    const stats = {
      total: 0,
      totalValue: 0,
      averageValue: 0,
      byStage: {} as Record<string, number>,
      conversionRate: 0,
      winRate: 0,
    };
    
    let closedWon = 0;
    let closedTotal = 0;
    
    for await (const entry of kv.list<Opportunity>({ prefix: ["opportunities"] })) {
      if (entry.key.length !== 2) continue;
      
      const opp = entry.value;
      stats.total++;
      stats.totalValue += opp.amount;
      
      stats.byStage[opp.stage] = (stats.byStage[opp.stage] || 0) + 1;
      
      if (opp.stage === "closed-won") {
        closedWon++;
        closedTotal++;
      } else if (opp.stage === "closed-lost") {
        closedTotal++;
      }
    }
    
    stats.averageValue = stats.total > 0 ? Math.round(stats.totalValue / stats.total) : 0;
    stats.winRate = closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0;
    
    return stats;
  }
}