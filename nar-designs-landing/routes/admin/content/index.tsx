import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../lib/auth/authService.ts";
import { ContentService } from "../../../lib/cms/contentService.ts";
import type { Content } from "../../../types/cms/content.ts";

interface ContentListData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  contents: Content[];
  filter: {
    type?: string;
    status?: string;
    search?: string;
  };
}

export const handler: Handlers<ContentListData> = {
  async GET(req, ctx) {
    const authService = new AuthService();
    const contentService = new ContentService();
    
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
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || undefined;

    // Get content based on filters
    let contents: Content[];
    if (search) {
      contents = await contentService.searchContent(search, { type, status });
    } else {
      contents = await contentService.listContent({ type, status });
    }

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      contents,
      filter: { type, status, search },
    });
  }
};

export default function ContentList({ data }: PageProps<ContentListData>) {
  const { user, contents, filter } = data;

  return (
    <AdminLayout currentPath="/admin/content" user={user}>
      <div class="space-y-6">
        {/* Header */}
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Content Management</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Create, edit, and manage your content</p>
          </div>
          <a href="/admin/content/new" class="btn-primary glow-purple">
            <span class="mr-2">➕</span>
            New Content
          </a>
        </div>

        {/* Filters */}
        <div class="card">
          <form method="GET" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Search Content
                </label>
                <input 
                  type="text" 
                  name="search"
                  value={filter.search || ""}
                  class="input"
                  placeholder="Search titles, content, or tags..."
                />
              </div>

              {/* Type Filter */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Content Type
                </label>
                <select name="type" class="input">
                  <option value="">All Types</option>
                  <option value="post" selected={filter.type === "post"}>Posts</option>
                  <option value="page" selected={filter.type === "page"}>Pages</option>
                  <option value="project" selected={filter.type === "project"}>Projects</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Status
                </label>
                <select name="status" class="input">
                  <option value="">All Status</option>
                  <option value="published" selected={filter.status === "published"}>Published</option>
                  <option value="draft" selected={filter.status === "draft"}>Draft</option>
                  <option value="archived" selected={filter.status === "archived"}>Archived</option>
                </select>
              </div>
            </div>

            <div class="flex gap-3">
              <button type="submit" class="btn-secondary">
                Apply Filters
              </button>
              <a href="/admin/content" class="btn-ghost">
                Clear Filters
              </a>
            </div>
          </form>
        </div>

        {/* Content List */}
        <div class="space-y-4">
          {contents.length > 0 ? (
            contents.map((content) => (
              <div key={content.id} class="card hover:transform hover:scale-[1.02] transition-all duration-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <h3 class="text-xl font-semibold text-[#E3DCD2]">{content.title}</h3>
                      <div class={`px-2 py-1 rounded text-xs font-mono ${
                        content.status === 'published' ? 'bg-secondary/20 text-secondary' :
                        content.status === 'draft' ? 'bg-accent/20 text-accent' :
                        'bg-[#E3DCD2]/20 text-[#E3DCD2]'
                      }`}>
                        {content.status}
                      </div>
                      <div class="px-2 py-1 rounded text-xs font-mono bg-primary/20 text-primary">
                        {content.type}
                      </div>
                    </div>
                    
                    {content.excerpt && (
                      <p class="text-[#E3DCD2]/70 mb-3">{content.excerpt}</p>
                    )}
                    
                    <div class="flex items-center space-x-4 text-sm text-[#E3DCD2]/60 font-mono">
                      <span>Updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
                      {content.publishedAt && (
                        <span>Published: {new Date(content.publishedAt).toLocaleDateString()}</span>
                      )}
                      {content.tags.length > 0 && (
                        <span>Tags: {content.tags.join(", ")}</span>
                      )}
                    </div>
                  </div>

                  <div class="flex items-center space-x-3">
                    {content.status === 'published' && (
                      <a 
                        href={`/${content.slug}`} 
                        target="_blank"
                        class="text-sm text-secondary hover:text-[#00A3D1] transition-colors duration-200"
                      >
                        View →
                      </a>
                    )}
                    
                    <a 
                      href={`/admin/content/edit/${content.id}`}
                      class="btn-ghost text-sm px-3 py-2"
                    >
                      Edit
                    </a>
                    
                    <form method="POST" action={`/admin/content/delete/${content.id}`} class="inline">
                      <button 
                        type="submit" 
                        class="text-sm text-accent hover:text-[#FF5A4A] transition-colors duration-200"
                        onclick="return confirm('Are you sure you want to delete this content?')"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div class="card text-center py-12">
              <div class="text-6xl mb-4">📝</div>
              <h3 class="text-xl font-semibold text-[#E3DCD2] mb-2">No Content Found</h3>
              <p class="text-[#E3DCD2]/70 mb-6">
                {filter.search || filter.type || filter.status 
                  ? "No content matches your current filters." 
                  : "Start creating your first piece of content!"
                }
              </p>
              <a href="/admin/content/new" class="btn-primary glow-purple">
                Create New Content
              </a>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div class="text-center text-sm font-mono text-[#E3DCD2]/60">
          // Showing {contents.length} {contents.length === 1 ? 'item' : 'items'}
        </div>
      </div>
    </AdminLayout>
  );
}