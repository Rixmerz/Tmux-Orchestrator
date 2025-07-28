import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../lib/auth/authService.ts";
import { ContentService } from "../../lib/cms/contentService.ts";

interface DashboardData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  stats: {
    totalContent: number;
    publishedContent: number;
    draftContent: number;
    recentContent: Array<{
      id: string;
      title: string;
      status: string;
      type: string;
      updatedAt: Date;
    }>;
  };
}

export const handler: Handlers<DashboardData> = {
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

    // Get dashboard stats
    const allContent = await contentService.listContent({ limit: 100 });
    const publishedContent = allContent.filter(c => c.status === 'published');
    const draftContent = allContent.filter(c => c.status === 'draft');
    const recentContent = allContent.slice(0, 5).map(c => ({
      id: c.id,
      title: c.title,
      status: c.status,
      type: c.type,
      updatedAt: c.updatedAt,
    }));

    const stats = {
      totalContent: allContent.length,
      publishedContent: publishedContent.length,
      draftContent: draftContent.length,
      recentContent,
    };

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      stats,
    });
  }
};

export default function AdminDashboard({ data }: PageProps<DashboardData>) {
  const { user, stats } = data;

  return (
    <AdminLayout currentPath="/admin" user={user}>
      <div class="space-y-8">
        {/* Header */}
        <div>
          <h1 class="text-4xl font-bold text-[#E3DCD2] mb-4">
            Bienvenido, <span class="text-primary">{user.username}</span>
          </h1>
          <p class="text-lg text-[#E3DCD2]/70">
            // Gestionando tu negocio de estampados con estilo
          </p>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Content */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center glow-purple">
                <span class="text-2xl">📄</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-primary">{stats.totalContent}</div>
                <div class="text-sm text-[#E3DCD2]/60">Total Content</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              // Todos tus diseños y productos creativos
            </div>
          </div>

          {/* Published Content */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl flex items-center justify-center glow-blue">
                <span class="text-2xl">🌐</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-secondary">{stats.publishedContent}</div>
                <div class="text-sm text-[#E3DCD2]/60">Published</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              // Productos disponibles en el catálogo
            </div>
          </div>

          {/* Draft Content */}
          <div class="card group hover:transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl flex items-center justify-center glow-orange">
                <span class="text-2xl">✏️</span>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-accent">{stats.draftContent}</div>
                <div class="text-sm text-[#E3DCD2]/60">Drafts</div>
              </div>
            </div>
            <div class="text-sm font-mono text-[#E3DCD2]/80">
              // Diseños en desarrollo
            </div>
          </div>
        </div>

        {/* Recent Content & Quick Actions */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Content */}
          <div class="card">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-[#E3DCD2]">Recent Content</h2>
              <a href="/admin/content" class="text-sm text-secondary hover:text-[#00A3D1] transition-colors duration-200">
                View All →
              </a>
            </div>
            
            <div class="space-y-3">
              {stats.recentContent.length > 0 ? (
                stats.recentContent.map((content) => (
                  <div key={content.id} class="flex items-center justify-between p-3 bg-[#0D0D0D]/30 rounded-lg border border-[#E3DCD2]/10 hover:border-[#E3DCD2]/20 transition-colors duration-200">
                    <div class="flex-1">
                      <div class="font-medium text-[#E3DCD2]">{content.title}</div>
                      <div class="text-sm text-[#E3DCD2]/60 font-mono">
                        {content.type} • {content.status} • {new Date(content.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div class={`px-2 py-1 rounded text-xs font-mono ${
                      content.status === 'published' ? 'bg-secondary/20 text-secondary' :
                      content.status === 'draft' ? 'bg-accent/20 text-accent' :
                      'bg-[#E3DCD2]/20 text-[#E3DCD2]'
                    }`}>
                      {content.status}
                    </div>
                  </div>
                ))
              ) : (
                <div class="text-center py-8 text-[#E3DCD2]/60">
                  <span class="text-4xl mb-4 block">📝</span>
                  <p>No content yet. Start creating!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div class="card">
            <h2 class="text-2xl font-bold text-[#E3DCD2] mb-6">Quick Actions</h2>
            
            <div class="space-y-4">
              <a href="/admin/content/new" class="block p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-200 group">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span class="text-xl">➕</span>
                  </div>
                  <div>
                    <div class="font-medium text-primary">Create New Content</div>
                    <div class="text-sm text-[#E3DCD2]/60">Start a new post, page, or project</div>
                  </div>
                </div>
              </a>

              <a href="/admin/media/upload" class="block p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all duration-200 group">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span class="text-xl">📤</span>
                  </div>
                  <div>
                    <div class="font-medium text-secondary">Upload Media</div>
                    <div class="text-sm text-[#E3DCD2]/60">Add images, videos, or documents</div>
                  </div>
                </div>
              </a>

              <a href="/admin/settings" class="block p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-200 group">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span class="text-xl">⚙️</span>
                  </div>
                  <div>
                    <div class="font-medium text-accent">Site Settings</div>
                    <div class="text-sm text-[#E3DCD2]/60">Configure your site preferences</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}