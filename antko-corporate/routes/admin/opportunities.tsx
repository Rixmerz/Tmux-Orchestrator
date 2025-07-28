import { Handlers, PageProps } from "$fresh/server.ts";
import { CRMLayout } from "../../components/CRMLayout.tsx";
import { SalesPipelineBoard } from "../../components/SalesPipelineBoard.tsx";
import { Opportunity } from "../../lib/types.ts";

interface Data {
  isAuthenticated: boolean;
  opportunities: Opportunity[];
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
    
    // Mock opportunity data - in production, this would come from PostgreSQL
    const opportunities: Opportunity[] = [
      {
        id: "1",
        title: "Industrial Water Treatment System",
        customerId: "1",
        amount: 85000,
        probability: 80,
        stage: "negotiation",
        products: ["1", "2"],
        expectedCloseDate: new Date("2024-02-15"),
        assignedTo: "Carlos Mendez",
        description: "Complete water treatment solution for manufacturing facility",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-22")
      },
      {
        id: "2",
        title: "Hotel Chain Filtration Upgrade",
        customerId: "3",
        amount: 125000,
        probability: 65,
        stage: "proposal",
        products: ["3", "4"],
        expectedCloseDate: new Date("2024-03-01"),
        assignedTo: "Ana Rodríguez",
        description: "Water filtration system upgrade for 5 hotel locations",
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-20")
      },
      {
        id: "3",
        title: "Medical Center Purification System",
        customerId: "4",
        amount: 95000,
        probability: 90,
        stage: "closed-won",
        products: ["5"],
        expectedCloseDate: new Date("2024-01-25"),
        assignedTo: "Luis Fernández",
        description: "Medical-grade water purification for surgical suites",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-25")
      },
      {
        id: "4",
        title: "Construction Site Water Supply",
        customerId: "5",
        amount: 45000,
        probability: 25,
        stage: "qualification",
        products: ["6"],
        expectedCloseDate: new Date("2024-04-10"),
        assignedTo: "Carlos Mendez",
        description: "Portable water treatment for construction project",
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-18")
      },
      {
        id: "5",
        title: "Restaurant Chain Water Systems",
        customerId: "2",
        amount: 67000,
        probability: 55,
        stage: "prospecting",
        products: ["7"],
        expectedCloseDate: new Date("2024-03-20"),
        assignedTo: "Ana Rodríguez",
        description: "Water filtration for restaurant kitchen operations",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-19")
      }
    ];
    
    return ctx.render({ isAuthenticated, opportunities });
  }
};

export default function OpportunitiesPage({ data }: PageProps<Data>) {
  const handleEdit = (opportunity: Opportunity) => {
    console.log("Edit opportunity:", opportunity.id);
  };

  const handleDelete = (opportunityId: string) => {
    console.log("Delete opportunity:", opportunityId);
  };

  const handleViewDetails = (opportunityId: string) => {
    console.log("View opportunity details:", opportunityId);
  };

  const handleStageChange = (opportunityId: string, newStage: string) => {
    console.log("Change stage:", opportunityId, "to", newStage);
  };

  // Calculate pipeline metrics
  const pipelineValue = data.opportunities.reduce((sum, opp) => sum + opp.amount, 0);
  const avgDealSize = pipelineValue / data.opportunities.length;
  const stageCount = data.opportunities.reduce((acc, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <CRMLayout 
      title="Sales Pipeline - ANTKO Corporate" 
      currentPath="/admin/opportunities"
      userRole="admin"
      userName="Admin User"
    >
      <div>
        <div class="mb-8">
          <h1 class="text-3xl font-bold font-display text-slate-900 mb-2">
            Sales Pipeline
          </h1>
          <p class="text-lg text-slate-600">
            Manage sales opportunities and track deals through the pipeline
          </p>
        </div>

        {/* Pipeline Metrics */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Total Pipeline Value</p>
                <p class="text-2xl font-bold text-slate-900">
                  ${(pipelineValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div class="text-3xl">💰</div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Active Opportunities</p>
                <p class="text-2xl font-bold text-blue-600">
                  {data.opportunities.filter(o => !o.stage.includes('closed')).length}
                </p>
              </div>
              <div class="text-3xl">🎯</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Avg Deal Size</p>
                <p class="text-2xl font-bold text-green-600">
                  ${(avgDealSize / 1000).toFixed(0)}K
                </p>
              </div>
              <div class="text-3xl">📊</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Won This Month</p>
                <p class="text-2xl font-bold text-emerald-600">
                  {stageCount['closed-won'] || 0}
                </p>
              </div>
              <div class="text-3xl">🏆</div>
            </div>
          </div>
        </div>

        {/* Sales Pipeline Board */}
        <SalesPipelineBoard
          opportunities={data.opportunities}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          onStageChange={handleStageChange}
        />
      </div>
    </CRMLayout>
  );
}