import { useState } from "preact/hooks";
import { Lead } from "../lib/types.ts";
import { LeadList } from "../components/LeadCard.tsx";
import { DataTable } from "../components/DataTable.tsx";
import { FormInput } from "../components/forms/FormInput.tsx";
import { FormSelect } from "../components/forms/FormSelect.tsx";
import { Button } from "../components/Button.tsx";

interface LeadManagementInterfaceProps {
  initialLeads: Lead[];
}

interface LeadFilters {
  status?: string;
  source?: string;
  assignedTo?: string;
  scoreMin?: number;
  scoreMax?: number;
}

export default function LeadManagementInterface({ initialLeads }: LeadManagementInterfaceProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "nurturing", label: "Nurturing" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" }
  ];

  const sourceOptions = [
    { value: "", label: "All Sources" },
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "cold-call", label: "Cold Call" },
    { value: "email", label: "Email" },
    { value: "social", label: "Social Media" },
    { value: "trade-show", label: "Trade Show" },
    { value: "other", label: "Other" }
  ];

  const handleEdit = async (lead: Lead) => {
    try {
      console.log("Editing lead:", lead.id);
      // TODO: Implement API call to edit lead
      // const response = await fetch(`/api/leads/${lead.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(lead)
      // });
      alert(`Edit lead: ${lead.firstName} ${lead.lastName}`);
    } catch (error) {
      setError("Failed to edit lead");
      console.error("Error editing lead:", error);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      setLoading(true);
      console.log("Deleting lead:", leadId);
      // TODO: Implement API call to delete lead
      // const response = await fetch(`/api/leads/${leadId}`, {
      //   method: 'DELETE'
      // });
      
      // Remove lead from state
      setLeads(leads.filter(lead => lead.id !== leadId));
      alert("Lead deleted successfully");
    } catch (error) {
      setError("Failed to delete lead");
      console.error("Error deleting lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (leadId: string) => {
    try {
      setLoading(true);
      console.log("Converting lead:", leadId);
      // TODO: Implement API call to convert lead to customer
      // const response = await fetch(`/api/leads/${leadId}/convert`, {
      //   method: 'POST'
      // });
      
      // Update lead status to converted
      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: "converted" as const }
          : lead
      ));
      alert("Lead converted to customer successfully");
    } catch (error) {
      setError("Failed to convert lead");
      console.error("Error converting lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (leadId: string) => {
    console.log("View lead details:", leadId);
    // TODO: Navigate to lead details page or open modal
    alert(`View details for lead: ${leadId}`);
  };

  const handleFilterChange = (key: keyof LeadFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    applyFilters(newFilters, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(filters, query);
  };

  const applyFilters = (currentFilters: LeadFilters, query: string) => {
    let filteredLeads = [...initialLeads];

    // Apply search
    if (query) {
      filteredLeads = filteredLeads.filter(lead =>
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
        lead.email.toLowerCase().includes(query.toLowerCase()) ||
        lead.company.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    if (currentFilters.status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === currentFilters.status);
    }
    if (currentFilters.source) {
      filteredLeads = filteredLeads.filter(lead => lead.source === currentFilters.source);
    }
    if (currentFilters.scoreMin) {
      filteredLeads = filteredLeads.filter(lead => lead.score >= currentFilters.scoreMin!);
    }

    setLeads(filteredLeads);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setLeads(initialLeads);
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    const sortedLeads = [...leads].sort((a, b) => {
      const aValue = a[column as keyof Lead];
      const bValue = b[column as keyof Lead];
      
      if (direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    setLeads(sortedLeads);
  };

  const tableColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (_, lead: Lead) => (
        <div>
          <div class="font-medium text-slate-900">{lead.firstName} {lead.lastName}</div>
          <div class="text-sm text-slate-500">{lead.jobTitle}</div>
        </div>
      )
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      render: (company: string) => (
        <div class="font-medium text-slate-900">{company}</div>
      )
    },
    {
      key: "email",
      label: "Contact",
      render: (_, lead: Lead) => (
        <div class="space-y-1">
          <div class="text-sm text-slate-900">{lead.email}</div>
          <div class="text-sm text-slate-500">{lead.phone}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (status: string) => {
        const statusColors = {
          new: "bg-blue-100 text-blue-800",
          contacted: "bg-yellow-100 text-yellow-800",
          qualified: "bg-green-100 text-green-800",
          nurturing: "bg-purple-100 text-purple-800",
          converted: "bg-emerald-100 text-emerald-800",
          lost: "bg-red-100 text-red-800"
        };
        return (
          <span class={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      key: "score",
      label: "Score",
      sortable: true,
      render: (score: number) => {
        const getScoreColor = (score: number) => {
          if (score >= 80) return "text-green-600";
          if (score >= 60) return "text-yellow-600";
          if (score >= 40) return "text-orange-600";
          return "text-red-600";
        };
        return (
          <div class={`font-semibold ${getScoreColor(score)}`}>
            {score}
          </div>
        );
      }
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (source: string) => {
        const sourceIcons = {
          website: "🌐",
          referral: "👥",
          "cold-call": "📞",
          email: "📧",
          social: "📱",
          "trade-show": "🏢",
          other: "📌"
        };
        return (
          <div class="flex items-center space-x-2">
            <span>{sourceIcons[source as keyof typeof sourceIcons]}</span>
            <span class="text-sm text-slate-600 capitalize">{source.replace("-", " ")}</span>
          </div>
        );
      }
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      sortable: true,
      render: (assignedTo: string) => (
        <div class="text-sm text-slate-600">{assignedTo}</div>
      )
    }
  ];

  const getLeadStats = () => {
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === "new").length,
      qualified: leads.filter(l => l.status === "qualified").length,
      converted: leads.filter(l => l.status === "converted").length,
      avgScore: leads.reduce((sum, l) => sum + l.score, 0) / leads.length || 0
    };
    return stats;
  };

  const stats = getLeadStats();

  return (
    <div class="space-y-6">
      {/* Error Display */}
      {error && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="text-red-800">{error}</div>
          <button 
            onClick={() => setError("")}
            class="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Lead Management</h2>
          <p class="text-slate-600">Track and nurture your sales leads</p>
        </div>
        <div class="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <div class="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "cards" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📋 Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "table" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 Table
            </button>
          </div>
          <Button href="/admin/leads/new" disabled={loading}>Add Lead</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div class="text-sm text-slate-600">Total Leads</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div class="text-sm text-slate-600">New Leads</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-2xl font-bold text-green-600">{stats.qualified}</div>
          <div class="text-sm text-slate-600">Qualified</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-2xl font-bold text-emerald-600">{stats.converted}</div>
          <div class="text-sm text-slate-600">Converted</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-2xl font-bold text-purple-600">{stats.avgScore.toFixed(0)}</div>
          <div class="text-sm text-slate-600">Avg Score</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div class="md:col-span-2">
              <FormInput
                name="search"
                label="Search"
                value={searchQuery}
                placeholder="Search leads..."
                onChange={handleSearch}
              />
            </div>
            <FormSelect
              name="status"
              label="Status"
              value={filters.status || ""}
              options={statusOptions}
              onChange={(value) => handleFilterChange("status", value)}
            />
            <FormSelect
              name="source"
              label="Source"
              value={filters.source || ""}
              options={sourceOptions}
              onChange={(value) => handleFilterChange("source", value)}
            />
            <FormInput
              name="scoreMin"
              label="Min Score"
              type="number"
              value={filters.scoreMin?.toString() || ""}
              placeholder="0"
              onChange={(value) => handleFilterChange("scoreMin", parseInt(value) || 0)}
            />
            <div class="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full"
                disabled={loading}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div class="text-center py-8">
          <div class="text-lg">Loading...</div>
        </div>
      ) : viewMode === "cards" ? (
        <LeadList
          leads={leads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <DataTable
          data={leads}
          columns={tableColumns}
          loading={loading}
          error={error}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchable={false} // We handle search separately
        />
      )}
    </div>
  );
}