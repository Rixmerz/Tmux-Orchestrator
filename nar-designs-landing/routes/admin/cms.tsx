import { Handlers } from "$fresh/server.ts";

// Redirect /admin/cms to /admin/content for consistency
export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    return Response.redirect(new URL("/admin/content", url.origin));
  }
};