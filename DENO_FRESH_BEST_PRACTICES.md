# Deno Fresh Best Practices Guide

*Compiled from proven patterns in speedrunners-landing, pulsehub, and pharmaflow projects*

## 🏗️ Project Architecture

### **Directory Structure (MANDATORY)**

```
project/
├── routes/              # File-based routing ONLY
│   ├── _app.tsx        # App wrapper with HTML structure
│   ├── _middleware.ts  # Global middleware
│   ├── api/            # API endpoints
│   ├── admin/          # Role-specific routes
│   └── [pages].tsx     # Page handlers
├── components/         # Server-side UI components
├── islands/           # Client-side interactive components
├── lib/               # Core utilities and business logic
│   ├── db.ts          # Database operations
│   ├── auth.ts        # Authentication utilities
│   └── [domain].ts    # Domain-specific utilities
├── config/            # Configuration files
├── static/            # Static assets
├── fresh.config.ts    # Fresh framework config
├── deno.json          # Deno configuration
└── tailwind.config.ts # Tailwind customization
```

### **Component Separation Rules**

**🚨 CRITICAL: Strict Component Placement**
- **`/routes/`**: ONLY page handlers and API endpoints
- **`/components/`**: Reusable server-side UI components
- **`/islands/`**: Interactive client-side components (use sparingly)

**❌ NEVER put UI components in `/routes/` directory**
**✅ ALWAYS move reusable components to `/components/`**
**✅ ONLY use `/islands/` for true interactivity needs**

## 🔐 Authentication Patterns

### **Session-Based Authentication (Proven Pattern)**

```typescript
// lib/auth.ts - Standard Structure
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export async function getAuthState(request: Request): Promise<AuthState> {
  const cookies = getCookies(request.headers);
  const sessionId = cookies.session;
  
  if (!sessionId) return { user: null, isAuthenticated: false };
  
  try {
    const db = await getDb();
    const session = await db.getSession(sessionId);
    if (!session) return { user: null, isAuthenticated: false };
    
    const user = await db.getUser(session.userId);
    if (!user) return { user: null, isAuthenticated: false };
    
    return { user, isAuthenticated: true };
  } catch (error) {
    console.error("Auth error:", error);
    return { user: null, isAuthenticated: false };
  }
}
```

### **Role-Based Access Control**

```typescript
// Multi-role system (from pulsehub)
export function requireRole(allowedRoles: User["role"][]) {
  return async (request: Request, context: any) => {
    const authState = await getAuthState(request);
    
    if (!authState.isAuthenticated || !authState.user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    
    if (!allowedRoles.includes(authState.user.role)) {
      return new Response("Forbidden", { status: 403 });
    }
    
    context.state.auth = authState;
    return context.next();
  };
}
```

### **Enhanced Security Options**

**Dual Password System** (speedrunners-landing/pharmaflow):
```typescript
interface User {
  password1Hash: string;  // Primary authentication
  password2Hash: string;  // Secondary verification
}
```

**Organization-Scoped Access** (pulsehub):
```typescript
interface User {
  role: "super_admin" | "administrador" | "vendedor" | "cliente";
  organizationId?: string;  // null for super_admin
  storeIds: string[];       // Access scope
}
```

## 🗄️ Database Patterns

### **Deno KV Standard Implementation**

```typescript
// lib/db.ts - Core Pattern
class Database {
  private kv: Deno.Kv;
  
  constructor(kv: Deno.Kv) {
    this.kv = kv;
  }
  
  // Standard CRUD with UUID and timestamps
  async createEntity<T>(
    prefix: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<T> {
    const id = crypto.randomUUID();
    const now = new Date();
    const entity = { ...data, id, createdAt: now, updatedAt: now } as T;
    
    await this.kv.set([prefix, id], entity);
    return entity;
  }
}
```

### **Indexing Strategy**

```typescript
// Multi-index pattern for efficient queries
await kv.set(["users", id], user);                    // Primary key
await kv.set(["users_by_email", email], id);          // Email lookup
await kv.set(["users_by_role", role, id], true);      // Role filtering
await kv.set(["users_by_org", orgId, id], true);      // Organization scope
```

### **Initialization Pattern**

```typescript
// main.ts - Database initialization
try {
  console.log("🔄 Initializing database...");
  await Database.initializeDefaultData();
  console.log("✅ Database initialization completed!");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
}
```

## ⚙️ Configuration Standards

### **Fresh Configuration**

```typescript
// fresh.config.ts - Standard setup
import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwind()],
  server: {
    port: 8000,  // Consistent port
  },
});
```

### **Deno Configuration**

```json
// deno.json - Standard tasks
{
  "lock": false,
  "tasks": {
    "check": "deno fmt --check && deno lint && deno check **/*.ts && deno check **/*.tsx",
    "start": "deno run -A --unstable-kv --watch=static/,routes/,components/,islands/ dev.ts",
    "build": "deno run -A --unstable-kv dev.ts build",
    "preview": "deno run -A --unstable-kv main.ts",
    "dev": "deno task start"
  },
  "lint": {
    "rules": { "tags": ["fresh", "recommended"] }
  },
  "exclude": ["**/_fresh/*"]
}
```

## 🎨 UI/UX Patterns

### **Tailwind Integration**

```typescript
// tailwind.config.ts - Custom theme pattern
export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#0A0A1F",
        "brand-primary": "#E91E63",
        "brand-secondary": "#FF5722",
      },
      fontFamily: {
        'display': ['Lobster', 'cursive'],
        'body': ['Montserrat', 'sans-serif'],
      },
    },
  },
};
```

### **Responsive Design Standards**

- Mobile-first approach
- Consistent spacing scale (4, 8, 16, 24, 32px)
- Semantic color naming
- Custom font integration

## 🔧 Development Workflow

### **Environment Setup**

```typescript
// main.ts - Standard imports
import "$std/dotenv/load.ts";
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
```

### **Error Handling Pattern**

```typescript
// Consistent error handling
try {
  const result = await operation();
  return ctx.render({ data: result });
} catch (error) {
  console.error("Operation failed:", error);
  return ctx.render({ error: "Operation failed" });
}
```

## 📋 Quality Standards

### **Code Quality Checklist**

- [ ] Components properly separated (routes/components/islands)
- [ ] Authentication implemented with session management
- [ ] Database operations use proper indexing
- [ ] Error handling implemented consistently
- [ ] TypeScript types defined for all entities
- [ ] Responsive design implemented
- [ ] Environment variables properly loaded
- [ ] Default data initialization included

### **Security Checklist**

- [ ] Session cookies are httpOnly and secure
- [ ] Password hashing implemented (not plain text)
- [ ] Role-based access control enforced
- [ ] Input validation on all forms
- [ ] CSRF protection considered
- [ ] SQL injection prevention (KV queries)

## 🚀 Deployment Patterns

### **Production Readiness**

```typescript
// Environment validation
export function validateProductionConfig() {
  const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
```

### **Performance Optimization**

- Server-side rendering by default
- Minimal client-side JavaScript (islands)
- Efficient database indexing
- Static asset optimization
- Proper caching headers

---

**🎯 Key Takeaway**: These patterns have been proven across three production Deno Fresh applications. Following these guidelines ensures consistent, maintainable, and scalable applications.
