import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../../lib/auth/authService.ts";
import { ContentService } from "../../../../lib/cms/contentService.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
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

    try {
      const contentId = ctx.params.id;
      const success = await contentService.deleteContent(contentId);
      
      if (!success) {
        // Content not found or failed to delete
        return new Response("Content not found or failed to delete", { status: 404 });
      }

      // Redirect back to content list with success
      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/content", url.origin));
    } catch (error) {
      console.error("Error deleting content:", error);
      return new Response("Failed to delete content", { status: 500 });
    }
  }
};