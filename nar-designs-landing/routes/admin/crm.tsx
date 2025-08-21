import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../lib/auth/authService.ts";
import { ContactService } from "../../lib/crm/contactService.ts";
import { OpportunityService } from "../../lib/crm/opportunityService.ts";
import { ActivityService } from "../../lib/crm/activityService.ts";

interface CRMDashboardData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  stats: {
    contacts: {
      total: number;
      newThisMonth: number;
      byStatus: Record<string, number>;
    };
    opportunities: {
      total: number;
      totalValue: number;
      averageValue: number;
      conversionRate: number;
      byStage: Record<string, { count: number; value: number }>;
    };
    activities: {
      total: number;
      completed: number;
      scheduled: number;
      overdue: number;
      thisWeek: number;
    };
  };
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    status: string;
    createdAt: Date;
    contactName?: string;
  }>;
  pipeline: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
}

export const handler: Handlers<CRMDashboardData> = {
  async GET(req, ctx) {
    const authService = new AuthService();
    const contactService = new ContactService();
    const opportunityService = new OpportunityService();
    const activityService = new ActivityService();
    
    // Check authentication
    const token = req.headers.get("cookie")?.split("session_token=")[1]?.split(";")[0];
    if (!token) {
      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/login", url.origin));
    }

    const user = await authService.validateSession(token);
    if (!user) {
      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/login", url.origin));
    }

    try {
      // Get all stats in parallel
      const [contactStats, opportunityStats, activityStats, recentActivitiesData, pipelineData] = await Promise.all([
        contactService.getContactStats(),
        opportunityService.getOpportunityStats(),
        activityService.getActivityStats(user.id),
        activityService.listActivities({ limit: 10 }),
        opportunityService.getPipelineOverview(),
      ]);

      // Enhance recent activities with contact names
      const recentActivities = await Promise.all(
        recentActivitiesData.map(async (activity) => {
          let contactName: string | undefined;
          if (activity.contactId) {
            const contact = await contactService.getContactById(activity.contactId);
            contactName = contact ? `${contact.firstName} ${contact.lastName}` : undefined;
          }
          return {
            id: activity.id,
            type: activity.type,
            subject: activity.subject,
            status: activity.status,
            createdAt: activity.createdAt,
            contactName,
          };
        })
      );

      const pipeline = pipelineData.map(stage => ({
        stage: stage.stage,
        count: stage.count,
        value: stage.value,
      }));

      return ctx.render({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        stats: {
          contacts: {
            total: contactStats.total,
            newThisMonth: contactStats.newThisMonth,
            byStatus: contactStats.byStatus,
          },
          opportunities: {
            total: opportunityStats.total,
            totalValue: opportunityStats.totalValue,
            averageValue: opportunityStats.averageValue,
            conversionRate: opportunityStats.conversionRate,
            byStage: opportunityStats.byStage,
          },
          activities: activityStats,
        },
        recentActivities,
        pipeline,
      });
    } catch (error) {
      console.error("CRM Dashboard error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
};

export default function CRMDashboard({ data }: PageProps<CRMDashboardData>) {
  const { user, stats, recentActivities, pipeline } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'prospecting': 'text-[#E3DCD2]',
      'qualification': 'text-secondary',
      'proposal': 'text-primary',
      'negotiation': 'text-accent',
      'closed_won': 'text-green-400',
      'closed_lost': 'text-red-400',
    };
    return colors[stage] || 'text-[#E3DCD2]';
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'call': '📞',
      'email': '📧',
      'meeting': '🤝',
      'note': '📝',
      'task': '✅',
      'proposal_sent': '📄',
      'follow_up': '🔄',
    };
    return icons[type] || '📋';
  };

  return (
    <AdminLayout currentPath="/admin/crm" user={user}>
      <div class="space-y-8">
        {/* Header */}
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-4xl font-bold text-[#E3DCD2] mb-4">
              CRM Dashboard
            </h1>
            <p class="text-lg text-[#E3DCD2]/70">
              // Customer relationship management with style
            </p>
          </div>
          <div class="flex space-x-3">
            <a href="/admin/crm/contacts/new" class="btn-primary glow-purple">
              <span class="mr-2">👤</span>
              New Contact
            </a>
            <a href="/admin/crm/opportunities/new" class="btn-secondary glow-blue">
              <span class="mr-2">💼</span>
              New Opportunity
            </a>
          </div>
        </div>

        {/* Key Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Contacts */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center glow-purple">
                <span class="text-2xl">👥</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-primary">{stats.contacts.total}</div>
                <div class="text-sm text-[#E3DCD2]/60">Total Contacts</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              +{stats.contacts.newThisMonth} this month
            </div>
          </div>

          {/* Pipeline Value */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl flex items-center justify-center glow-blue">
                <span class="text-2xl">💰</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-secondary">{formatCurrency(stats.opportunities.totalValue)}</div>
                <div class="text-sm text-[#E3DCD2]/60">Pipeline Value</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              {stats.opportunities.total} opportunities
            </div>
          </div>

          {/* Conversion Rate */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl flex items-center justify-center glow-orange">
                <span class="text-2xl">📈</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-accent">{stats.opportunities.conversionRate.toFixed(1)}%</div>
                <div class="text-sm text-[#E3DCD2]/60">Conversion Rate</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              Average: {formatCurrency(stats.opportunities.averageValue)}
            </div>
          </div>

          {/* Activities */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⚡</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-[#E3DCD2]">{stats.activities.thisWeek}</div>
                <div class="text-sm text-[#E3DCD2]/60">This Week</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              {stats.activities.overdue > 0 && (
                <span class="text-accent">{stats.activities.overdue} overdue</span>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Overview & Recent Activity */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pipeline Overview */}
          <div class="card">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-[#E3DCD2]">Sales Pipeline</h2>
              <a href="/admin/crm/opportunities" class="text-sm text-secondary hover:text-[#00A3D1] transition-colors duration-200">
                View All →
              </a>
            </div>
            
            <div class="space-y-4">
              {pipeline.map((stage) => (
                <div key={stage.stage} class="flex items-center justify-between p-4 bg-[#0D0D0D]/30 rounded-lg border border-[#E3DCD2]/10">
                  <div class="flex-1">
                    <div class={`font-medium capitalize ${getStageColor(stage.stage)}`}>
                      {stage.stage.replace('_', ' ')}
                    </div>
                    <div class="text-sm text-[#E3DCD2]/60 font-mono">
                      {stage.count} {stage.count === 1 ? 'opportunity' : 'opportunities'}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-[#E3DCD2]">{formatCurrency(stage.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div class="card">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-[#E3DCD2]">Recent Activity</h2>
              <a href="/admin/crm/activities" class="text-sm text-secondary hover:text-[#00A3D1] transition-colors duration-200">
                View All →
              </a>
            </div>
            
            <div class="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} class="flex items-center space-x-3 p-3 bg-[#0D0D0D]/30 rounded-lg border border-[#E3DCD2]/10 hover:border-[#E3DCD2]/20 transition-colors duration-200">
                    <div class="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-[#E3DCD2] truncate">{activity.subject}</div>
                      <div class="text-sm text-[#E3DCD2]/60 font-mono">
                        {activity.contactName && `${activity.contactName} • `}
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div class={`px-2 py-1 rounded text-xs font-mono ${
                      activity.status === 'completed' ? 'bg-secondary/20 text-secondary' :
                      activity.status === 'scheduled' ? 'bg-primary/20 text-primary' :
                      'bg-[#E3DCD2]/20 text-[#E3DCD2]'
                    }`}>
                      {activity.status}
                    </div>
                  </div>
                ))
              ) : (
                <div class="text-center py-8 text-[#E3DCD2]/60">
                  <span class="text-4xl mb-4 block">📋</span>
                  <p>No activities yet. Start engaging!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="card">
          <h2 class="text-2xl font-bold text-[#E3DCD2] mb-6">Quick Actions</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/admin/crm/contacts" class="block p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-200 group">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span class="text-xl">👥</span>
                </div>
                <div>
                  <div class="font-medium text-primary">Manage Contacts</div>
                  <div class="text-sm text-[#E3DCD2]/60">View and edit contacts</div>
                </div>
              </div>
            </a>

            <a href="/admin/crm/opportunities" class="block p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all duration-200 group">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span class="text-xl">💼</span>
                </div>
                <div>
                  <div class="font-medium text-secondary">Opportunities</div>
                  <div class="text-sm text-[#E3DCD2]/60">Track sales pipeline</div>
                </div>
              </div>
            </a>

            <a href="/admin/crm/activities" class="block p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-200 group">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span class="text-xl">📅</span>
                </div>
                <div>
                  <div class="font-medium text-accent">Activities</div>
                  <div class="text-sm text-[#E3DCD2]/60">Schedule and track</div>
                </div>
              </div>
            </a>

            <a href="/admin/crm/reports" class="block p-4 bg-gradient-to-r from-[#E3DCD2]/10 to-[#E3DCD2]/5 rounded-lg border border-[#E3DCD2]/20 hover:border-[#E3DCD2]/40 transition-all duration-200 group">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-[#E3DCD2]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span class="text-xl">📊</span>
                </div>
                <div>
                  <div class="font-medium text-[#E3DCD2]">Reports</div>
                  <div class="text-sm text-[#E3DCD2]/60">Analytics and insights</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}