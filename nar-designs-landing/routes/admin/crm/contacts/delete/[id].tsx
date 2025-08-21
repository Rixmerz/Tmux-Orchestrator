import { Handlers } from "$fresh/server.ts";
import { AuthService } from "../../../../../lib/auth/authService.ts";
import { ContactService } from "../../../../../lib/crm/contactService.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
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

    try {
      const contactId = ctx.params.id;
      const success = await contactService.deleteContact(contactId);
      
      if (!success) {
        // Contact not found or failed to delete
        return new Response("Contact not found or failed to delete", { status: 404 });
      }

      // Redirect back to contact list with success
      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/crm/contacts", url.origin));
    } catch (error) {
      console.error("Error deleting contact:", error);
      return new Response("Failed to delete contact", { status: 500 });
    }
  }
};