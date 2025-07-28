import { Handlers, PageProps } from "$fresh/server.ts";
import { CRMLayout } from "../../components/CRMLayout.tsx";
import { Button } from "../../components/Button.tsx";

interface Data {
  isAuthenticated: boolean;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const cookies = req.headers.get("Cookie") || "";
    const isAuthenticated = cookies.includes("auth=authenticated");
    
    if (!isAuthenticated) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin" }
      });
    }
    
    return ctx.render({ isAuthenticated });
  }
};

export default function ReportsPage({ data }: PageProps<Data>) {
  // Mock report data
  const salesMetrics = {
    totalRevenue: 1250000,
    monthlyRevenue: 185000,
    quarterlyGrowth: 23.5,
    conversionRate: 24.5,
    avgDealSize: 67500,
    topSalesperson: "Ana Rodríguez",
    topProduct: "Industrial Filtration System"
  };

  const reportTypes = [
    {
      id: "sales-performance",
      name: "Sales Performance",
      description: "Revenue, deals closed, and sales team performance metrics",
      icon: "📈",
      color: "blue"
    },
    {
      id: "customer-analytics",
      name: "Customer Analytics",
      description: "Customer acquisition, retention, and lifetime value analysis",
      icon: "👥",
      color: "green"
    },
    {
      id: "pipeline-analysis",
      name: "Pipeline Analysis",
      description: "Sales funnel performance and opportunity forecasting",
      icon: "🔄",
      color: "purple"
    },
    {
      id: "product-performance",
      name: "Product Performance",
      description: "Product sales analysis and market demand insights",
      icon: "📦",
      color: "blue"
    },
    {
      id: "territory-analysis",
      name: "Territory Analysis",
      description: "Geographic sales performance and market penetration",
      icon: "🗺️",
      color: "green"
    },
    {
      id: "activity-reports",
      name: "Activity Reports",
      description: "Sales team activities, calls, meetings, and tasks",
      icon: "📅",
      color: "purple"
    }
  ];

  return (
    <CRMLayout 
      title="Reports & Analytics - ANTKO Corporate" 
      currentPath="/admin/reports"
      userRole="admin"
      userName="Admin User"
    >
      <div>
        <div class="mb-8">
          <h1 class="text-3xl font-bold font-display text-slate-900 mb-2">
            Reports & Analytics
          </h1>
          <p class="text-lg text-slate-600">
            Comprehensive sales and business intelligence reports
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Total Revenue</p>
                <p class="text-2xl font-bold text-slate-900">
                  ${(salesMetrics.totalRevenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div class="text-3xl">💰</div>
            </div>
            <div class="mt-2">
              <span class="text-sm text-green-600 font-medium">↗ +{salesMetrics.quarterlyGrowth}%</span>
              <span class="text-sm text-slate-500 ml-2">vs last quarter</span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Monthly Revenue</p>
                <p class="text-2xl font-bold text-blue-600">
                  ${(salesMetrics.monthlyRevenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div class="text-3xl">📊</div>
            </div>
            <div class="mt-2">
              <span class="text-sm text-green-600 font-medium">↗ +12%</span>
              <span class="text-sm text-slate-500 ml-2">vs last month</span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Conversion Rate</p>
                <p class="text-2xl font-bold text-green-600">
                  {salesMetrics.conversionRate}%
                </p>
              </div>
              <div class="text-3xl">🎯</div>
            </div>
            <div class="mt-2">
              <span class="text-sm text-green-600 font-medium">↗ +3.2%</span>
              <span class="text-sm text-slate-500 ml-2">vs last month</span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Avg Deal Size</p>
                <p class="text-2xl font-bold text-purple-600">
                  ${(salesMetrics.avgDealSize / 1000).toFixed(0)}K
                </p>
              </div>
              <div class="text-3xl">💎</div>
            </div>
            <div class="mt-2">
              <span class="text-sm text-green-600 font-medium">↗ +8.5%</span>
              <span class="text-sm text-slate-500 ml-2">vs last month</span>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report) => (
            <div key={report.id} class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-4">
                <div class="text-4xl">{report.icon}</div>
                <Button size="sm" variant="primary">
                  Generate
                </Button>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 mb-2">
                {report.name}
              </h3>
              <p class="text-sm text-slate-600 mb-4">
                {report.description}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Last updated: 2 hours ago</span>
                <button class="text-sm text-antko-blue-600 hover:text-antko-blue-800">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Insights */}
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">Quick Insights</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-slate-900 mb-2">🏆 Top Performers</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Best Salesperson:</span>
                  <span class="text-sm font-medium text-slate-900">{salesMetrics.topSalesperson}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Best Product:</span>
                  <span class="text-sm font-medium text-slate-900">{salesMetrics.topProduct}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Best Territory:</span>
                  <span class="text-sm font-medium text-slate-900">San Juan Metro</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-slate-900 mb-2">📊 Recent Trends</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Lead Generation:</span>
                  <span class="text-sm font-medium text-green-600">↗ +25%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Deal Velocity:</span>
                  <span class="text-sm font-medium text-green-600">↗ +18%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-600">Customer Retention:</span>
                  <span class="text-sm font-medium text-green-600">↗ +12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}