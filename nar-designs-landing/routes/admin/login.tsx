import { Handlers, PageProps } from "$fresh/server.ts";
import { AuthService } from "../../lib/auth/authService.ts";

interface LoginData {
  error?: string;
  hasAdminUsers: boolean;
}

export const handler: Handlers<LoginData> = {
  async GET(req, ctx) {
    const authService = new AuthService();
    
    // Check if user is already logged in
    const token = req.headers.get("cookie")?.split("session_token=")[1]?.split(";")[0];
    if (token) {
      const user = await authService.validateSession(token);
      if (user) {
        const url = new URL(req.url);
        return Response.redirect(new URL("/admin", url.origin));
      }
    }

    // Check if admin users exist
    const hasAdminUsers = await authService.hasAdminUsers();

    return ctx.render({ hasAdminUsers });
  },

  async POST(req, ctx) {
    const authService = new AuthService();
    const formData = await req.formData();
    
    const username = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();
    const isSetup = formData.get("setup") === "true";

    if (!username || !password) {
      return ctx.render({ 
        error: "Username and password are required",
        hasAdminUsers: await authService.hasAdminUsers()
      });
    }

    try {
      if (isSetup) {
        // Create initial admin user
        const email = formData.get("email")?.toString();
        if (!email) {
          return ctx.render({ 
            error: "Email is required for setup",
            hasAdminUsers: false
          });
        }

        await authService.createAdminUser(username, email, password);
        
        // Login the newly created user
        const loginResult = await authService.login({ username, password });
        if (!loginResult.success) {
          return ctx.render({ 
            error: loginResult.error || "Setup failed",
            hasAdminUsers: false
          });
        }

        // Set session cookie
        const headers = new Headers();
        headers.set("location", "/admin");
        headers.set("set-cookie", `session_token=${loginResult.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
        
        return new Response(null, { status: 302, headers });
      } else {
        // Regular login
        const loginResult = await authService.login({ username, password });
        
        if (!loginResult.success) {
          return ctx.render({ 
            error: loginResult.error || "Login failed",
            hasAdminUsers: await authService.hasAdminUsers()
          });
        }

        // Set session cookie
        const headers = new Headers();
        headers.set("location", "/admin");
        headers.set("set-cookie", `session_token=${loginResult.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
        
        return new Response(null, { status: 302, headers });
      }
    } catch (error) {
      return ctx.render({ 
        error: error.message || "An error occurred",
        hasAdminUsers: await authService.hasAdminUsers()
      });
    }
  }
};

export default function AdminLogin({ data }: PageProps<LoginData>) {
  const { error, hasAdminUsers } = data;
  const isSetup = !hasAdminUsers;

  return (
    <div class="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Background ambient effects */}
      <div class="absolute inset-0">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div class="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1.5s;"></div>
      </div>

      {/* Login Form */}
      <div class="relative z-10 w-full max-w-md px-4">
        <div class="card">
          {/* Header */}
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-primary glow-purple mb-2">
              NAR.CMS
            </h1>
            <p class="text-lg text-[#E3DCD2] mb-2">
              {isSetup ? "Initial Setup" : "Content Management"}
            </p>
            <p class="text-sm font-mono text-[#E3DCD2]/60">
              {isSetup ? "// Create your admin account" : "// Sign in to continue"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div class="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <p class="text-accent text-sm">{error}</p>
            </div>
          )}

          {/* Setup Notice */}
          {isSetup && (
            <div class="mb-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <p class="text-secondary text-sm">
                Welcome! Create your first admin account to get started.
              </p>
            </div>
          )}

          {/* Form */}
          <form method="POST" class="space-y-6">
            {isSetup && (
              <input type="hidden" name="setup" value="true" />
            )}

            {isSetup && (
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  name="email"
                  class="input"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            )}

            <div>
              <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                Username
              </label>
              <input 
                type="text" 
                name="username"
                class="input"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                Password
              </label>
              <input 
                type="password" 
                name="password"
                class="input"
                placeholder="Enter secure password"
                required
                autoComplete={isSetup ? "new-password" : "current-password"}
              />
            </div>

            <button 
              type="submit" 
              class="w-full btn-primary glow-purple text-lg py-4"
            >
              {isSetup ? "Create Admin Account" : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div class="mt-8 pt-6 border-t border-[#E3DCD2]/10 text-center">
            <a 
              href="/" 
              class="text-sm text-[#E3DCD2]/60 hover:text-secondary transition-colors duration-200"
            >
              ← Back to main site
            </a>
          </div>
        </div>
      </div>

      {/* Grain overlay */}
      <div class="absolute inset-0 opacity-[0.02] bg-repeat pointer-events-none" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHZpZXdCb3g9IjAgMCA0IDQiPjxwYXRoIGQ9Ik0xIDFoMXYxSDFWMXptMiAyaDF2MUgzVjN6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xIi8+PC9zdmc+');"></div>
    </div>
  );
}