import { Handlers, PageProps } from "$fresh/server.ts";
import { CRMLayout } from "../../components/CRMLayout.tsx";
import { DataTable } from "../../components/DataTable.tsx";
import { SalesUser } from "../../lib/types.ts";
import { Button } from "../../components/Button.tsx";

interface Data {
  isAuthenticated: boolean;
  users: SalesUser[];
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
    
    // Mock user data - in production, this would come from PostgreSQL
    const users: SalesUser[] = [
      {
        id: "1",
        name: "Ana Rodríguez",
        email: "ana@antko.com",
        role: "sales-manager",
        territory: "San Juan Metro",
        quota: 500000,
        active: true,
        createdAt: new Date("2024-01-01")
      },
      {
        id: "2",
        name: "Carlos Mendez",
        email: "carlos@antko.com",
        role: "sales-rep",
        territory: "Bayamón",
        quota: 300000,
        active: true,
        createdAt: new Date("2024-01-02")
      },
      {
        id: "3",
        name: "Luis Fernández",
        email: "luis@antko.com",
        role: "sales-rep",
        territory: "Ponce",
        quota: 250000,
        active: true,
        createdAt: new Date("2024-01-03")
      },
      {
        id: "4",
        name: "María González",
        email: "maria@antko.com",
        role: "sales-rep",
        territory: "Caguas",
        quota: 200000,
        active: false,
        createdAt: new Date("2023-12-15")
      },
      {
        id: "5",
        name: "Admin User",
        email: "admin@antko.com",
        role: "admin",
        territory: "All",
        quota: undefined,
        active: true,
        createdAt: new Date("2023-11-01")
      }
    ];
    
    return ctx.render({ isAuthenticated, users });
  }
};

export default function UsersPage({ data }: PageProps<Data>) {
  const handleEdit = (user: SalesUser) => {
    console.log("Edit user:", user.id);
  };

  const handleDelete = (userId: string) => {
    console.log("Delete user:", userId);
  };

  const handleViewDetails = (userId: string) => {
    console.log("View user details:", userId);
  };

  const handleSearch = (query: string) => {
    console.log("Search users:", query);
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    console.log("Sort users:", column, direction);
  };

  const tableColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (name: string, user: SalesUser) => (
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-antko-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="font-medium text-slate-900">{name}</div>
            <div class="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (role: string) => {
        const roleColors = {
          admin: "bg-purple-100 text-purple-800",
          "sales-manager": "bg-blue-100 text-blue-800",
          "sales-rep": "bg-green-100 text-green-800"
        };
        const roleLabels = {
          admin: "Administrator",
          "sales-manager": "Sales Manager",
          "sales-rep": "Sales Representative"
        };
        return (
          <span class={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors]}`}>
            {roleLabels[role as keyof typeof roleLabels]}
          </span>
        );
      }
    },
    {
      key: "territory",
      label: "Territory",
      sortable: true,
      render: (territory: string) => (
        <span class="text-sm text-slate-900">{territory}</span>
      )
    },
    {
      key: "quota",
      label: "Quota",
      sortable: true,
      render: (quota: number | undefined) => (
        <span class="text-sm text-slate-900">
          {quota ? `$${(quota / 1000).toFixed(0)}K` : "N/A"}
        </span>
      )
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      render: (active: boolean) => (
        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
          active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {active ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (createdAt: Date) => (
        <span class="text-sm text-slate-600">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  // Calculate user stats
  const userStats = {
    total: data.users.length,
    active: data.users.filter(u => u.active).length,
    salesReps: data.users.filter(u => u.role === "sales-rep").length,
    managers: data.users.filter(u => u.role === "sales-manager").length,
    admins: data.users.filter(u => u.role === "admin").length
  };

  return (
    <CRMLayout 
      title="User Management - ANTKO Corporate" 
      currentPath="/admin/users"
      userRole="admin"
      userName="Admin User"
    >
      <div>
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold font-display text-slate-900 mb-2">
                User Management
              </h1>
              <p class="text-lg text-slate-600">
                Manage sales team members and their permissions
              </p>
            </div>
            <Button href="/admin/users/new">Add User</Button>
          </div>
        </div>

        {/* User Stats */}
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Total Users</p>
                <p class="text-2xl font-bold text-slate-900">{userStats.total}</p>
              </div>
              <div class="text-3xl">👥</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Active Users</p>
                <p class="text-2xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <div class="text-3xl">✅</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Sales Reps</p>
                <p class="text-2xl font-bold text-blue-600">{userStats.salesReps}</p>
              </div>
              <div class="text-3xl">💼</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Managers</p>
                <p class="text-2xl font-bold text-purple-600">{userStats.managers}</p>
              </div>
              <div class="text-3xl">👔</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-600 mb-1">Admins</p>
                <p class="text-2xl font-bold text-red-600">{userStats.admins}</p>
              </div>
              <div class="text-3xl">🔑</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          data={data.users}
          columns={tableColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearch={handleSearch}
          onSort={handleSort}
          searchable={true}
        />
      </div>
    </CRMLayout>
  );
}