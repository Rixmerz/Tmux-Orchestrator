import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../../lib/auth/authService.ts";
import { ContactService } from "../../../../lib/crm/contactService.ts";
import type { Contact } from "../../../../types/crm/models.ts";

interface ContactListData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  contacts: Contact[];
  filter: {
    status?: string;
    source?: string;
    company?: string;
    search?: string;
  };
  stats: {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  };
}

export const handler: Handlers<ContactListData> = {
  async GET(req, ctx) {
    const authService = new AuthService();
    const contactService = new ContactService();
    
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

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const source = url.searchParams.get("source") || undefined;
    const company = url.searchParams.get("company") || undefined;
    const search = url.searchParams.get("search") || undefined;

    // Get contacts based on filters
    const contacts = await contactService.listContacts({
      status,
      source,
      company,
      search,
      limit: 100,
    });

    // Get statistics
    const stats = await contactService.getContactStats();

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      contacts,
      filter: { status, source, company, search },
      stats,
    });
  }
};

export default function ContactList({ data }: PageProps<ContactListData>) {
  const { user, contacts, filter, stats } = data;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-primary/20 text-primary',
      'qualified': 'bg-secondary/20 text-secondary',
      'contacted': 'bg-accent/20 text-accent',
      'nurturing': 'bg-yellow-500/20 text-yellow-400',
      'converted': 'bg-green-500/20 text-green-400',
      'lost': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-[#E3DCD2]/20 text-[#E3DCD2]';
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      'website': '🌐',
      'referral': '👥',
      'social': '📱',
      'cold_outreach': '📧',
      'event': '🎪',
      'other': '📋',
    };
    return icons[source] || '📋';
  };

  return (
    <AdminLayout currentPath="/admin/crm" user={user}>
      <div class="space-y-6">
        {/* Header */}
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Contact Management</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Building relationships that matter</p>
          </div>
          <a href="/admin/crm/contacts/new" class="btn-primary glow-purple">
            <span class="mr-2">➕</span>
            New Contact
          </a>
        </div>

        {/* Stats Overview */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card text-center">
            <div class="text-3xl font-bold text-primary mb-2">{stats.total}</div>
            <div class="text-sm text-[#E3DCD2]/60">Total Contacts</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-secondary mb-2">{stats.byStatus.qualified || 0}</div>
            <div class="text-sm text-[#E3DCD2]/60">Qualified Leads</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-accent mb-2">{stats.byStatus.converted || 0}</div>
            <div class="text-sm text-[#E3DCD2]/60">Converted</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-[#E3DCD2] mb-2">{stats.byStatus.new || 0}</div>
            <div class="text-sm text-[#E3DCD2]/60">New This Month</div>
          </div>
        </div>

        {/* Filters */}
        <div class="card">
          <form method="GET" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Search Contacts
                </label>
                <input 
                  type="text" 
                  name="search"
                  value={filter.search || ""}
                  class="input"
                  placeholder="Name, email, or company..."
                />
              </div>

              {/* Status Filter */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Status
                </label>
                <select name="status" class="input">
                  <option value="">All Status</option>
                  <option value="new" selected={filter.status === "new"}>New</option>
                  <option value="qualified" selected={filter.status === "qualified"}>Qualified</option>
                  <option value="contacted" selected={filter.status === "contacted"}>Contacted</option>
                  <option value="nurturing" selected={filter.status === "nurturing"}>Nurturing</option>
                  <option value="converted" selected={filter.status === "converted"}>Converted</option>
                  <option value="lost" selected={filter.status === "lost"}>Lost</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Source
                </label>
                <select name="source" class="input">
                  <option value="">All Sources</option>
                  <option value="website" selected={filter.source === "website"}>Website</option>
                  <option value="referral" selected={filter.source === "referral"}>Referral</option>
                  <option value="social" selected={filter.source === "social"}>Social Media</option>
                  <option value="cold_outreach" selected={filter.source === "cold_outreach"}>Cold Outreach</option>
                  <option value="event" selected={filter.source === "event"}>Event</option>
                  <option value="other" selected={filter.source === "other"}>Other</option>
                </select>
              </div>

              {/* Company Filter */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Company
                </label>
                <input 
                  type="text" 
                  name="company"
                  value={filter.company || ""}
                  class="input"
                  placeholder="Filter by company..."
                />
              </div>
            </div>

            <div class="flex gap-3">
              <button type="submit" class="btn-secondary">
                Apply Filters
              </button>
              <a href="/admin/crm/contacts" class="btn-ghost">
                Clear Filters
              </a>
            </div>
          </form>
        </div>

        {/* Contact List */}
        <div class="space-y-4">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <div key={contact.id} class="card hover:transform hover:scale-[1.02] transition-all duration-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    {/* Avatar */}
                    <div class="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                      <span class="text-lg font-bold text-[#E3DCD2]">
                        {contact.firstName.charAt(0).toUpperCase()}{contact.lastName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-xl font-semibold text-[#E3DCD2]">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <div class={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </div>
                        <div class="flex items-center space-x-1 text-xs text-[#E3DCD2]/60">
                          <span>{getSourceIcon(contact.source)}</span>
                          <span class="font-mono">{contact.source.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-4 text-sm text-[#E3DCD2]/80">
                        <span class="flex items-center">
                          <span class="mr-1">📧</span>
                          {contact.email}
                        </span>
                        {contact.phone && (
                          <span class="flex items-center">
                            <span class="mr-1">📞</span>
                            {contact.phone}
                          </span>
                        )}
                        {contact.company && (
                          <span class="flex items-center">
                            <span class="mr-1">🏢</span>
                            {contact.company}
                          </span>
                        )}
                      </div>

                      {contact.tags.length > 0 && (
                        <div class="flex flex-wrap gap-2 mt-2">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span key={tag} class="px-2 py-1 bg-[#E3DCD2]/10 text-[#E3DCD2]/80 text-xs rounded font-mono">
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span class="px-2 py-1 bg-[#E3DCD2]/10 text-[#E3DCD2]/60 text-xs rounded font-mono">
                              +{contact.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div class="flex items-center space-x-3">
                    <div class="text-right text-sm text-[#E3DCD2]/60 font-mono">
                      <div>Added: {new Date(contact.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(contact.updatedAt).toLocaleDateString()}</div>
                    </div>
                    
                    <a 
                      href={`/admin/crm/contacts/edit/${contact.id}`}
                      class="btn-ghost text-sm px-3 py-2"
                    >
                      Edit
                    </a>
                    
                    <a 
                      href={`/admin/crm/contacts/${contact.id}`}
                      class="btn-secondary text-sm px-3 py-2"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div class="card text-center py-12">
              <div class="text-6xl mb-4">👥</div>
              <h3 class="text-xl font-semibold text-[#E3DCD2] mb-2">No Contacts Found</h3>
              <p class="text-[#E3DCD2]/70 mb-6">
                {filter.search || filter.status || filter.source || filter.company
                  ? "No contacts match your current filters." 
                  : "Start building your network by adding your first contact!"
                }
              </p>
              <a href="/admin/crm/contacts/new" class="btn-primary glow-purple">
                Add First Contact
              </a>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {contacts.length > 0 && (
          <div class="text-center text-sm font-mono text-[#E3DCD2]/60">
            // Showing {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}