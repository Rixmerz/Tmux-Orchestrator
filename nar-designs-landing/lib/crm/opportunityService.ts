import { getKv, generateId, getCurrentTimestamp } from "../kv/kv.ts";
import type { Opportunity, CreateOpportunityRequest, UpdateOpportunityRequest, OpportunityFilters } from "../../types/crm/models.ts";

export class OpportunityService {
  private async getKv() {
    return await getKv();
  }

  // Create opportunity
  async createOpportunity(data: CreateOpportunityRequest, userId: string): Promise<Opportunity> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    
    const opportunity: Opportunity = {
      id: generateId(),
      title: data.title,
      contactId: data.contactId,
      value: data.value,
      currency: data.currency || 'USD',
      stage: (data.stage as any) || 'prospecting',
      probability: data.probability || this.getDefaultProbability(data.stage as any || 'prospecting'),
      expectedCloseDate: data.expectedCloseDate,
      source: data.source,
      description: data.description,
      tags: data.tags || [],
      assignedTo: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Store opportunity with multiple keys for different queries
    const result = await kv.atomic()
      .set(["opportunities", opportunity.id], opportunity)
      .set(["opportunities_by_contact", opportunity.contactId, opportunity.id], opportunity)
      .set(["opportunities_by_stage", opportunity.stage, opportunity.id], opportunity)
      .set(["opportunities_by_assigned", opportunity.assignedTo || "unassigned", opportunity.id], opportunity)
      .commit();

    if (!result.ok) {
      throw new Error("Failed to create opportunity");
    }

    return opportunity;
  }

  // Get default probability based on stage
  private getDefaultProbability(stage: Opportunity['stage']): number {
    const probabilities: Record<Opportunity['stage'], number> = {
      'prospecting': 10,
      'qualification': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed_won': 100,
      'closed_lost': 0,
    };
    return probabilities[stage] || 10;
  }

  // Get opportunity by ID
  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const kv = await this.getKv();
    const result = await kv.get<Opportunity>(["opportunities", id]);
    return result.value;
  }

  // Update opportunity
  async updateOpportunity(data: UpdateOpportunityRequest): Promise<Opportunity | null> {
    const kv = await this.getKv();
    const existing = await this.getOpportunityById(data.id);
    
    if (!existing) return null;

    const now = getCurrentTimestamp();
    
    const updated: Opportunity = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    // Handle stage change - update close date if won/lost
    if (data.stage && data.stage !== existing.stage) {
      if (data.stage === 'closed_won' || data.stage === 'closed_lost') {
        updated.actualCloseDate = now;
        updated.probability = data.stage === 'closed_won' ? 100 : 0;
      }
    }

    let atomic = kv.atomic()
      .set(["opportunities", updated.id], updated)
      .set(["opportunities_by_contact", updated.contactId, updated.id], updated)
      .set(["opportunities_by_stage", updated.stage, updated.id], updated)
      .set(["opportunities_by_assigned", updated.assignedTo || "unassigned", updated.id], updated);

    // Clean up old indexes if they changed
    if (existing.stage !== updated.stage) {
      atomic = atomic.delete(["opportunities_by_stage", existing.stage, updated.id]);
    }
    if (existing.assignedTo !== updated.assignedTo) {
      atomic = atomic.delete(["opportunities_by_assigned", existing.assignedTo || "unassigned", updated.id]);
    }

    const result = await atomic.commit();
    
    if (!result.ok) {
      throw new Error("Failed to update opportunity");
    }

    return updated;
  }

  // Delete opportunity
  async deleteOpportunity(id: string): Promise<boolean> {
    const kv = await this.getKv();
    const existing = await this.getOpportunityById(id);
    
    if (!existing) return false;

    const result = await kv.atomic()
      .delete(["opportunities", id])
      .delete(["opportunities_by_contact", existing.contactId, id])
      .delete(["opportunities_by_stage", existing.stage, id])
      .delete(["opportunities_by_assigned", existing.assignedTo || "unassigned", id])
      .commit();

    return result.ok;
  }

  // List opportunities with filters
  async listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    const kv = await this.getKv();
    const opportunities: Opportunity[] = [];
    
    let prefix: string[];
    if (filters.stage) {
      prefix = ["opportunities_by_stage", filters.stage];
    } else if (filters.contactId) {
      prefix = ["opportunities_by_contact", filters.contactId];
    } else if (filters.assignedTo) {
      prefix = ["opportunities_by_assigned", filters.assignedTo];
    } else {
      prefix = ["opportunities"];
    }

    let count = 0;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    for await (const entry of kv.list<Opportunity>({ prefix })) {
      if (count < offset) {
        count++;
        continue;
      }
      
      if (opportunities.length >= limit) break;
      
      // If we're using an index, get the full opportunity
      let opportunity: Opportunity;
      if (prefix.length > 1) {
        const opportunityData = await this.getOpportunityById(entry.key[entry.key.length - 1] as string);
        if (!opportunityData) continue;
        opportunity = opportunityData;
      } else {
        opportunity = entry.value;
      }

      // Apply additional filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const title = opportunity.title.toLowerCase();
        const description = (opportunity.description || "").toLowerCase();
        
        if (!title.includes(searchTerm) && !description.includes(searchTerm)) {
          continue;
        }
      }

      if (filters.minValue && opportunity.value < filters.minValue) continue;
      if (filters.maxValue && opportunity.value > filters.maxValue) continue;

      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => opportunity.tags.includes(tag));
        if (!hasTag) continue;
      }

      opportunities.push(opportunity);
      count++;
    }

    return opportunities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Get opportunities by contact
  async getOpportunitiesByContact(contactId: string): Promise<Opportunity[]> {
    return this.listOpportunities({ contactId });
  }

  // Get opportunity statistics
  async getOpportunityStats(): Promise<{
    total: number;
    totalValue: number;
    averageValue: number;
    byStage: Record<string, { count: number; value: number }>;
    conversionRate: number;
  }> {
    const kv = await this.getKv();
    const stats = {
      total: 0,
      totalValue: 0,
      averageValue: 0,
      byStage: {} as Record<string, { count: number; value: number }>,
      conversionRate: 0,
    };

    let wonCount = 0;
    let totalCount = 0;

    for await (const entry of kv.list<Opportunity>({ prefix: ["opportunities"] })) {
      const opportunity = entry.value;
      stats.total++;
      stats.totalValue += opportunity.value;
      totalCount++;

      // Count by stage
      if (!stats.byStage[opportunity.stage]) {
        stats.byStage[opportunity.stage] = { count: 0, value: 0 };
      }
      stats.byStage[opportunity.stage].count++;
      stats.byStage[opportunity.stage].value += opportunity.value;

      // Count won opportunities for conversion rate
      if (opportunity.stage === 'closed_won') {
        wonCount++;
      }
    }

    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
    stats.conversionRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;

    return stats;
  }

  // Move opportunity to next stage
  async moveOpportunityStage(id: string, newStage: Opportunity['stage'], lostReason?: string): Promise<boolean> {
    const opportunity = await this.getOpportunityById(id);
    if (!opportunity) return false;

    const updateData: UpdateOpportunityRequest = {
      id,
      stage: newStage,
      probability: this.getDefaultProbability(newStage),
    };

    if (lostReason && newStage === 'closed_lost') {
      updateData.lostReason = lostReason;
    }

    const updated = await this.updateOpportunity(updateData);
    return !!updated;
  }

  // Get pipeline overview
  async getPipelineOverview(): Promise<Array<{
    stage: string;
    count: number;
    value: number;
    opportunities: Opportunity[];
  }>> {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const pipeline = [];

    for (const stage of stages) {
      const opportunities = await this.listOpportunities({ stage });
      const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
      
      pipeline.push({
        stage,
        count: opportunities.length,
        value: totalValue,
        opportunities: opportunities.slice(0, 5), // Top 5 for overview
      });
    }

    return pipeline;
  }

  // Get revenue by month
  async getRevenueByMonth(months: number = 12): Promise<Array<{
    month: string;
    revenue: number;
    count: number;
  }>> {
    const kv = await this.getKv();
    const now = new Date();
    const monthlyRevenue: Record<string, { revenue: number; count: number }> = {};

    // Initialize months
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[monthKey] = { revenue: 0, count: 0 };
    }

    for await (const entry of kv.list<Opportunity>({ prefix: ["opportunities"] })) {
      const opportunity = entry.value;
      
      if (opportunity.stage === 'closed_won' && opportunity.actualCloseDate) {
        const monthKey = opportunity.actualCloseDate.toISOString().slice(0, 7);
        if (monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey].revenue += opportunity.value;
          monthlyRevenue[monthKey].count++;
        }
      }
    }

    return Object.entries(monthlyRevenue)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}