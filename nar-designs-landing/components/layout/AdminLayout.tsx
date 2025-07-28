import { JSX } from "preact";

interface AdminLayoutProps {
  children: JSX.Element | JSX.Element[];
  currentPath?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export default function AdminLayout({ children, currentPath, user }: AdminLayoutProps) {
  const navigation = [
    { href: "/admin", label: "Dashboard", icon: "🏠" },
    { href: "/admin/content", label: "CMS", icon: "📝" },
    { href: "/admin/crm", label: "CRM", icon: "👥" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div class="min-h-screen bg-dark">
      {/* Admin Header */}
      <header class="bg-soft-gray border-b border-[#E3DCD2]/10 sticky top-0 z-50">
        <div class="px-6 py-4">
          <div class="flex justify-between items-center">
            {/* Logo & Brand */}
            <div class="flex items-center space-x-4">
              <a href="/" class="text-xl font-bold text-primary glow-purple">
                NAR.CMS
              </a>
              <span class="text-sm font-mono text-[#E3DCD2]/60">
                // Content Management
              </span>
            </div>

            {/* User Info & Actions */}
            <div class="flex items-center space-x-4">
              <a 
                href="/" 
                class="text-sm text-[#E3DCD2]/80 hover:text-secondary transition-colors duration-200"
                target="_blank"
              >
                View Site →
              </a>
              
              <div class="flex items-center space-x-3 px-4 py-2 bg-[#0D0D0D] rounded-lg border border-[#E3DCD2]/20">
                <div class="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <span class="text-sm font-bold text-[#E3DCD2]">
                    {user?.username.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div class="text-sm">
                  <div class="text-[#E3DCD2] font-medium">{user?.username || 'Admin'}</div>
                  <div class="text-[#E3DCD2]/60 text-xs">{user?.role || 'admin'}</div>
                </div>
              </div>

              <form method="POST" action="/admin/logout" class="inline">
                <button 
                  type="submit"
                  class="text-sm text-accent hover:text-[#FF5A4A] transition-colors duration-200"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div class="flex">
        {/* Sidebar Navigation */}
        <aside class="w-64 bg-gradient-to-b from-[#2C2C2E] to-[#0D0D0D] min-h-screen border-r border-[#E3DCD2]/10">
          <nav class="p-6">
            <div class="space-y-2">
              {navigation.map((item) => {
                const isActive = currentPath === item.href || 
                  (item.href !== '/admin' && currentPath?.startsWith(item.href));
                
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    class={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? "bg-primary/20 text-primary border border-primary/30 glow-purple" 
                        : "text-[#E3DCD2]/80 hover:bg-[#E3DCD2]/5 hover:text-[#E3DCD2]"
                    }`}
                  >
                    <span class="text-xl">{item.icon}</span>
                    <span class="font-medium">{item.label}</span>
                    {isActive && (
                      <div class="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse-glow"></div>
                    )}
                  </a>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div class="mt-8 p-4 bg-[#0D0D0D]/50 rounded-lg border border-[#E3DCD2]/10">
              <h3 class="text-sm font-mono text-[#E3DCD2]/60 mb-3">// Quick Stats</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-[#E3DCD2]/80">Published</span>
                  <span class="text-secondary">12</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#E3DCD2]/80">Drafts</span>
                  <span class="text-accent">3</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#E3DCD2]/80">Media</span>
                  <span class="text-primary">24</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main class="flex-1 min-h-screen">
          <div class="p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Ambient background effects */}
      <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-glow"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 2s;"></div>
      </div>
    </div>
  );
}