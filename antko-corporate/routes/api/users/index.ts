import { Handlers } from "$fresh/server.ts";
import { AuthState, requireAuth, hasPermission } from "../../../lib/auth.ts";
import { UserService } from "../../../lib/users.ts";

export const handler: Handlers<any, AuthState> = {
  async GET(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions - only admins and managers can list users
    if (!hasPermission(ctx.state.user!.role, "users", "read")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const users = await UserService.list();
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        territory: user.territory,
        quota: user.quota,
        active: user.active,
        createdAt: user.createdAt
      }));
      
      return new Response(
        JSON.stringify({ users: sanitizedUsers }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Get users error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  
  async POST(req, ctx) {
    // Require authentication
    const authCheck = await requireAuth()(req, ctx);
    if (authCheck.status !== 200) {
      return authCheck;
    }
    
    // Check permissions - only admins can create users
    if (!hasPermission(ctx.state.user!.role, "users", "write")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    try {
      const userData = await req.json();
      
      // Validate required fields
      const requiredFields = ["firstName", "lastName", "email", "role"];
      
      for (const field of requiredFields) {
        if (!userData[field]) {
          return new Response(
            JSON.stringify({ error: `${field} is required` }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Check if user already exists
      const existingUser = await UserService.findByEmail(userData.email);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User with this email already exists" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Set defaults
      userData.name = `${userData.firstName} ${userData.lastName}`;
      userData.active = userData.active !== undefined ? userData.active : true;
      userData.passwordHash = await UserService.hashPassword(userData.password || "welcome123");
      
      const user = await UserService.create(userData);
      
      // Remove sensitive data from response
      const sanitizedUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        territory: user.territory,
        quota: user.quota,
        active: user.active,
        createdAt: user.createdAt
      };
      
      return new Response(
        JSON.stringify({ user: sanitizedUser }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Create user error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};