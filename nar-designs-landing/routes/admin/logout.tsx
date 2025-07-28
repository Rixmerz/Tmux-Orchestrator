import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../lib/auth/authService.ts";

export const handler: Handlers = {
  async POST(req) {
    const authService = new AuthService();
    
    // Get session token from cookie
    const token = req.headers.get("cookie")?.split("session_token=")[1]?.split(";")[0];
    
    if (token) {
      await authService.logout(token);
    }

    // Clear session cookie and redirect
    const headers = new Headers();
    headers.set("location", "/admin/login");
    headers.set("set-cookie", "session_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
    
    return new Response(null, { status: 302, headers });
  }
};