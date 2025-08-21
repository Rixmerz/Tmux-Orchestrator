import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../../lib/auth/authService.ts";
import { ContactService } from "../../../../lib/crm/contactService.ts";

interface NewContactData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  error?: string;
}

export const handler: Handlers<NewContactData> = {
  async GET(req, ctx) {
    const authService = new AuthService();
    
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

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  },

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
      const formData = await req.formData();
      
      const firstName = formData.get("firstName")?.toString();
      const lastName = formData.get("lastName")?.toString();
      const email = formData.get("email")?.toString();
      const phone = formData.get("phone")?.toString();
      const company = formData.get("company")?.toString();
      const jobTitle = formData.get("jobTitle")?.toString();
      const source = formData.get("source")?.toString();
      const status = formData.get("status")?.toString() || "new";
      const tags = formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [];
      const notes = formData.get("notes")?.toString();
      
      // Social links
      const linkedin = formData.get("linkedin")?.toString();
      const twitter = formData.get("twitter")?.toString();
      const website = formData.get("website")?.toString();
      
      // Address
      const street = formData.get("street")?.toString();
      const city = formData.get("city")?.toString();
      const state = formData.get("state")?.toString();
      const zipCode = formData.get("zipCode")?.toString();
      const country = formData.get("country")?.toString();

      if (!firstName || !lastName || !email || !source) {
        return ctx.render({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          error: "First name, last name, email, and source are required",
        });
      }

      // Check if contact with this email already exists
      const existingContact = await contactService.getContactByEmail(email);
      if (existingContact) {
        return ctx.render({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          error: "A contact with this email already exists",
        });
      }

      const newContact = await contactService.createContact({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
        source,
        status,
        tags,
        notes: notes || undefined,
        socialLinks: (linkedin || twitter || website) ? {
          linkedin: linkedin || undefined,
          twitter: twitter || undefined,
          website: website || undefined,
        } : undefined,
        address: (street || city || state || zipCode || country) ? {
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
          country: country || undefined,
        } : undefined,
      }, user.id);

      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/crm/contacts", url.origin));
    } catch (error) {
      return ctx.render({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        error: error.message || "Failed to create contact",
      });
    }
  }
};

export default function NewContact({ data }: PageProps<NewContactData>) {
  const { user, error } = data;

  return (
    <AdminLayout currentPath="/admin/crm" user={user}>
      <div class="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Add New Contact</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Building meaningful connections</p>
          </div>
          <a href="/admin/crm/contacts" class="btn-ghost">
            ← Back to Contacts
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div class="card bg-accent/10 border-accent/30">
            <p class="text-accent">{error}</p>
          </div>
        )}

        {/* Creation Form */}
        <form method="POST" class="space-y-6">
          {/* Basic Information */}
          <div class="card">
            <h2 class="text-xl font-semibold text-[#E3DCD2] mb-6 flex items-center">
              <span class="mr-3">👤</span>
              Basic Information
            </h2>
            
            <div class="space-y-6">
              {/* Name */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    First Name *
                  </label>
                  <input 
                    type="text" 
                    name="firstName"
                    class="input"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Last Name *
                  </label>
                  <input 
                    type="text" 
                    name="lastName"
                    class="input"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    class="input"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    class="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Professional Info */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Company
                  </label>
                  <input 
                    type="text" 
                    name="company"
                    class="input"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Job Title
                  </label>
                  <input 
                    type="text" 
                    name="jobTitle"
                    class="input"
                    placeholder="Marketing Director"
                  />
                </div>
              </div>

              {/* Source and Status */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Lead Source *
                  </label>
                  <select name="source" class="input" required>
                    <option value="">Choose source</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="cold_outreach">Cold Outreach</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Status
                  </label>
                  <select name="status" class="input">
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="contacted">Contacted</option>
                    <option value="nurturing">Nurturing</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Tags
                </label>
                <input 
                  type="text" 
                  name="tags"
                  class="input"
                  placeholder="vip, designer, startup, enterprise..."
                />
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Separate multiple tags with commas
                </p>
              </div>

              {/* Notes */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Notes
                </label>
                <textarea 
                  name="notes"
                  rows="4"
                  class="input resize-none"
                  placeholder="Initial conversation notes, interests, pain points..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div class="card">
            <h2 class="text-xl font-semibold text-[#E3DCD2] mb-6 flex items-center">
              <span class="mr-3">🔗</span>
              Social Links
            </h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  LinkedIn Profile
                </label>
                <input 
                  type="url" 
                  name="linkedin"
                  class="input"
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Twitter Profile
                </label>
                <input 
                  type="url" 
                  name="twitter"
                  class="input"
                  placeholder="https://twitter.com/johndoe"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Personal Website
                </label>
                <input 
                  type="url" 
                  name="website"
                  class="input"
                  placeholder="https://johndoe.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div class="card">
            <h2 class="text-xl font-semibold text-[#E3DCD2] mb-6 flex items-center">
              <span class="mr-3">📍</span>
              Address Information
            </h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Street Address
                </label>
                <input 
                  type="text" 
                  name="street"
                  class="input"
                  placeholder="123 Main Street"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    City
                  </label>
                  <input 
                    type="text" 
                    name="city"
                    class="input"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    State/Province
                  </label>
                  <input 
                    type="text" 
                    name="state"
                    class="input"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input 
                    type="text" 
                    name="zipCode"
                    class="input"
                    placeholder="94105"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Country
                </label>
                <input 
                  type="text" 
                  name="country"
                  class="input"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex justify-between items-center pt-6">
            <a href="/admin/crm/contacts" class="btn-ghost">
              Cancel
            </a>
            
            <button 
              type="submit" 
              class="btn-primary glow-purple text-lg px-8 py-4"
            >
              Create Contact
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div class="card bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h3 class="text-lg font-semibold text-[#E3DCD2] mb-4 flex items-center">
            <span class="mr-3">💡</span>
            Contact Creation Tips
          </h3>
          <div class="space-y-2 text-sm text-[#E3DCD2]/80">
            <p><strong class="text-primary">Lead Source</strong> helps track which channels bring the best contacts</p>
            <p><strong class="text-secondary">Tags</strong> make it easy to segment and organize your contact list</p>
            <p><strong class="text-accent">Notes</strong> capture important context from your first interaction</p>
            <p class="font-mono text-xs text-[#E3DCD2]/60">// All fields except name, email, and source are optional</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}