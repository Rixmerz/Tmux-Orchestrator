import { getKv, generateId, getCurrentTimestamp } from "../kv/kv.ts";
import type { Activity, CreateActivityRequest, UpdateActivityRequest, ActivityFilters } from "../../types/crm/models.ts";

export class ActivityService {
  private async getKv() {
    return await getKv();
  }

  // Create activity
  async createActivity(data: CreateActivityRequest, userId: string): Promise<Activity> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    
    const activity: Activity = {
      id: generateId(),
      type: data.type as any,
      subject: data.subject,
      description: data.description,
      contactId: data.contactId,
      opportunityId: data.opportunityId,
      userId,
      scheduledAt: data.scheduledAt,
      status: data.scheduledAt ? 'scheduled' : 'completed',
      duration: data.duration,
      completedAt: data.scheduledAt ? undefined : now,
      createdAt: now,
      updatedAt: now,
    };

    // Store activity with multiple keys for different queries
    let atomic = kv.atomic()
      .set(["activities", activity.id], activity)
      .set(["activities_by_user", activity.userId, activity.id], activity)
      .set(["activities_by_type", activity.type, activity.id], activity)
      .set(["activities_by_status", activity.status, activity.id], activity);

    if (activity.contactId) {
      atomic = atomic.set(["activities_by_contact", activity.contactId, activity.id], activity);
    }

    if (activity.opportunityId) {
      atomic = atomic.set(["activities_by_opportunity", activity.opportunityId, activity.id], activity);
    }

    const result = await atomic.commit();

    if (!result.ok) {
      throw new Error("Failed to create activity");
    }

    return activity;
  }

  // Get activity by ID
  async getActivityById(id: string): Promise<Activity | null> {
    const kv = await this.getKv();
    const result = await kv.get<Activity>(["activities", id]);
    return result.value;
  }

  // Update activity
  async updateActivity(data: UpdateActivityRequest): Promise<Activity | null> {
    const kv = await this.getKv();
    const existing = await this.getActivityById(data.id);
    
    if (!existing) return null;

    const now = getCurrentTimestamp();
    
    const updated: Activity = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    // Update completion time if status changed to completed
    if (data.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = now;
    }

    let atomic = kv.atomic()
      .set(["activities", updated.id], updated)
      .set(["activities_by_user", updated.userId, updated.id], updated)
      .set(["activities_by_type", updated.type, updated.id], updated)
      .set(["activities_by_status", updated.status, updated.id], updated);

    if (updated.contactId) {
      atomic = atomic.set(["activities_by_contact", updated.contactId, updated.id], updated);
    }

    if (updated.opportunityId) {
      atomic = atomic.set(["activities_by_opportunity", updated.opportunityId, updated.id], updated);
    }

    // Clean up old indexes if they changed
    if (existing.status !== updated.status) {
      atomic = atomic.delete(["activities_by_status", existing.status, updated.id]);
    }
    if (existing.type !== updated.type) {
      atomic = atomic.delete(["activities_by_type", existing.type, updated.id]);
    }

    // Handle contact/opportunity changes
    if (existing.contactId && existing.contactId !== updated.contactId) {
      atomic = atomic.delete(["activities_by_contact", existing.contactId, updated.id]);
    }
    if (existing.opportunityId && existing.opportunityId !== updated.opportunityId) {
      atomic = atomic.delete(["activities_by_opportunity", existing.opportunityId, updated.id]);
    }

    const result = await atomic.commit();
    
    if (!result.ok) {
      throw new Error("Failed to update activity");
    }

    return updated;
  }

  // Delete activity
  async deleteActivity(id: string): Promise<boolean> {
    const kv = await this.getKv();
    const existing = await this.getActivityById(id);
    
    if (!existing) return false;

    let atomic = kv.atomic()
      .delete(["activities", id])
      .delete(["activities_by_user", existing.userId, id])
      .delete(["activities_by_type", existing.type, id])
      .delete(["activities_by_status", existing.status, id]);

    if (existing.contactId) {
      atomic = atomic.delete(["activities_by_contact", existing.contactId, id]);
    }

    if (existing.opportunityId) {
      atomic = atomic.delete(["activities_by_opportunity", existing.opportunityId, id]);
    }

    const result = await atomic.commit();
    return result.ok;
  }

  // List activities with filters
  async listActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
    const kv = await this.getKv();
    const activities: Activity[] = [];
    
    let prefix: string[];
    if (filters.contactId) {
      prefix = ["activities_by_contact", filters.contactId];
    } else if (filters.opportunityId) {
      prefix = ["activities_by_opportunity", filters.opportunityId];
    } else if (filters.userId) {
      prefix = ["activities_by_user", filters.userId];
    } else if (filters.type) {
      prefix = ["activities_by_type", filters.type];
    } else if (filters.status) {
      prefix = ["activities_by_status", filters.status];
    } else {
      prefix = ["activities"];
    }

    let count = 0;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    for await (const entry of kv.list<Activity>({ prefix })) {
      if (count < offset) {
        count++;
        continue;
      }
      
      if (activities.length >= limit) break;
      
      // If we're using an index, get the full activity
      let activity: Activity;
      if (prefix.length > 1) {
        const activityData = await this.getActivityById(entry.key[entry.key.length - 1] as string);
        if (!activityData) continue;
        activity = activityData;
      } else {
        activity = entry.value;
      }

      // Apply date filters
      if (filters.dateFrom || filters.dateTo) {
        const activityDate = activity.scheduledAt || activity.completedAt || activity.createdAt;
        if (filters.dateFrom && activityDate < filters.dateFrom) continue;
        if (filters.dateTo && activityDate > filters.dateTo) continue;
      }

      activities.push(activity);
      count++;
    }

    return activities.sort((a, b) => {
      const aDate = a.scheduledAt || a.completedAt || a.createdAt;
      const bDate = b.scheduledAt || b.completedAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
  }

  // Get activities by contact
  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    return this.listActivities({ contactId });
  }

  // Get activities by opportunity
  async getActivitiesByOpportunity(opportunityId: string): Promise<Activity[]> {
    return this.listActivities({ opportunityId });
  }

  // Get upcoming activities (scheduled)
  async getUpcomingActivities(userId?: string, days: number = 7): Promise<Activity[]> {
    const now = new Date();
    const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const activities = await this.listActivities({
      status: 'scheduled',
      userId,
      dateFrom: now,
      dateTo: future,
    });

    return activities.sort((a, b) => {
      const aDate = a.scheduledAt || a.createdAt;
      const bDate = b.scheduledAt || b.createdAt;
      return aDate.getTime() - bDate.getTime();
    });
  }

  // Get overdue activities
  async getOverdueActivities(userId?: string): Promise<Activity[]> {
    const now = new Date();
    
    const activities = await this.listActivities({
      status: 'scheduled',
      userId,
      dateTo: now,
    });

    return activities.filter(activity => 
      activity.scheduledAt && activity.scheduledAt < now
    );
  }

  // Complete activity
  async completeActivity(id: string, outcome?: string, nextAction?: string): Promise<boolean> {
    const updated = await this.updateActivity({
      id,
      status: 'completed',
      outcome,
      nextAction,
    });
    return !!updated;
  }

  // Get activity statistics
  async getActivityStats(userId?: string): Promise<{
    total: number;
    completed: number;
    scheduled: number;
    overdue: number;
    byType: Record<string, number>;
    thisWeek: number;
  }> {
    const kv = await this.getKv();
    const stats = {
      total: 0,
      completed: 0,
      scheduled: 0,
      overdue: 0,
      byType: {} as Record<string, number>,
      thisWeek: 0,
    };

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const prefix = userId ? ["activities_by_user", userId] : ["activities"];

    for await (const entry of kv.list<Activity>({ prefix })) {
      const activity = entry.value;
      
      // Skip if filtering by user and this isn't their activity
      if (userId && activity.userId !== userId) continue;
      
      stats.total++;

      // Count by status
      if (activity.status === 'completed') stats.completed++;
      if (activity.status === 'scheduled') {
        stats.scheduled++;
        // Check if overdue
        if (activity.scheduledAt && activity.scheduledAt < now) {
          stats.overdue++;
        }
      }

      // Count by type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

      // Count this week
      const activityDate = activity.completedAt || activity.scheduledAt || activity.createdAt;
      if (activityDate >= weekStart) {
        stats.thisWeek++;
      }
    }

    return stats;
  }

  // Log automatic activity (like email sent, meeting scheduled, etc.)
  async logAutomaticActivity(
    type: Activity['type'],
    subject: string,
    description: string,
    contactId?: string,
    opportunityId?: string,
    userId?: string
  ): Promise<Activity> {
    return this.createActivity({
      type,
      subject,
      description,
      contactId,
      opportunityId,
    }, userId || 'system');
  }

  // Get activity timeline for contact or opportunity
  async getTimeline(contactId?: string, opportunityId?: string): Promise<Activity[]> {
    if (contactId) {
      return this.getActivitiesByContact(contactId);
    } else if (opportunityId) {
      return this.getActivitiesByOpportunity(opportunityId);
    } else {
      return [];
    }
  }
}