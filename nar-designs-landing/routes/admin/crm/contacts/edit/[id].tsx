import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../../../lib/auth/authService.ts";
import { ContactService } from "../../../../../lib/crm/contactService.ts";
import type { Contact } from "../../../../../types/crm/models.ts";

interface EditContactData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  contact: Contact;
  error?: string;
}

export const handler: Handlers<EditContactData> = {
  async GET(req, ctx) {
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

    // Get contact by ID
    const contactId = ctx.params.id;
    const contact = await contactService.getContactById(contactId);
    
    if (!contact) {
      return new Response("Contact not found", { status: 404 });
    }

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      contact,
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

    const contactId = ctx.params.id;
    const existingContact = await contactService.getContactById(contactId);
    
    if (!existingContact) {
      return new Response("Contact not found", { status: 404 });
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
      const status = formData.get("status")?.toString();
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

      if (!firstName || !lastName || !email || !source || !status) {
        return ctx.render({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          contact: existingContact,
          error: "First name, last name, email, source, and status are required",
        });
      }

      // Check if email is being changed and already exists
      if (email !== existingContact.email) {
        const emailContact = await contactService.getContactByEmail(email);
        if (emailContact) {
          return ctx.render({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            },
            contact: existingContact,
            error: "A contact with this email already exists",
          });
        }
      }

      await contactService.updateContact({
        id: contactId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
        source: source as any,
        status: status as any,
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
      });

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
        contact: existingContact,
        error: error.message || "Failed to update contact",
      });
    }
  }
};

export default function EditContact({ data }: PageProps<EditContactData>) {
  const { user, contact, error } = data;

  return (
    <AdminLayout currentPath="/admin/crm" user={user}>
      <div class="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Edit Contact</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Updating connection details</p>
          </div>
          <div class="flex space-x-3">
            <a href={`/admin/crm/contacts/${contact.id}`} class="btn-secondary glow-blue">
              View Profile →
            </a>
            <a href="/admin/crm/contacts" class="btn-ghost">
              ← Back to Contacts
            </a>
          </div>
        </div>

        {/* Contact Status Badge */}
        <div class="flex items-center space-x-4">
          <div class={`px-4 py-2 rounded-lg font-mono text-sm ${
            contact.status === 'converted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            contact.status === 'qualified' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
            contact.status === 'contacted' ? 'bg-accent/20 text-accent border border-accent/30' :
            contact.status === 'new' ? 'bg-primary/20 text-primary border border-primary/30' :
            'bg-[#E3DCD2]/20 text-[#E3DCD2] border border-[#E3DCD2]/30'
          }`}>
            {contact.status.toUpperCase()}
          </div>
          <div class="text-sm text-[#E3DCD2]/60 font-mono">
            Created: {new Date(contact.createdAt).toLocaleDateString()} | 
            Updated: {new Date(contact.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div class="card bg-accent/10 border-accent/30">
            <p class="text-accent">{error}</p>
          </div>
        )}

        {/* Edit Form */}
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
                    value={contact.firstName}
                    class="input"
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
                    value={contact.lastName}
                    class="input"
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
                    value={contact.email}
                    class="input"
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
                    value={contact.phone || ""}
                    class="input"
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
                    value={contact.company || ""}
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Job Title
                  </label>
                  <input 
                    type="text" 
                    name="jobTitle"
                    value={contact.jobTitle || ""}
                    class="input"
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
                    <option value="website" selected={contact.source === "website"}>Website</option>
                    <option value="referral" selected={contact.source === "referral"}>Referral</option>
                    <option value="social" selected={contact.source === "social"}>Social Media</option>
                    <option value="cold_outreach" selected={contact.source === "cold_outreach"}>Cold Outreach</option>
                    <option value="event" selected={contact.source === "event"}>Event</option>
                    <option value="other" selected={contact.source === "other"}>Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Status *
                  </label>
                  <select name="status" class="input" required>
                    <option value="new" selected={contact.status === "new"}>New</option>
                    <option value="qualified" selected={contact.status === "qualified"}>Qualified</option>
                    <option value="contacted" selected={contact.status === "contacted"}>Contacted</option>
                    <option value="nurturing" selected={contact.status === "nurturing"}>Nurturing</option>
                    <option value="converted" selected={contact.status === "converted"}>Converted</option>
                    <option value="lost" selected={contact.status === "lost"}>Lost</option>
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
                  value={contact.tags.join(", ")}
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
                  placeholder="Conversation notes, interests, pain points..."
                >{contact.notes || ""}</textarea>
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
                  value={contact.socialLinks?.linkedin || ""}
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
                  value={contact.socialLinks?.twitter || ""}
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
                  value={contact.socialLinks?.website || ""}
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
                  value={contact.address?.street || ""}
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
                    value={contact.address?.city || ""}
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
                    value={contact.address?.state || ""}
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
                    value={contact.address?.zipCode || ""}
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
                  value={contact.address?.country || ""}
                  class="input"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex justify-between items-center pt-6">
            <div class="flex space-x-4">
              <a href="/admin/crm/contacts" class="btn-ghost">
                Cancel
              </a>
              <form method="POST" action={`/admin/crm/contacts/delete/${contact.id}`} class="inline">
                <button 
                  type="submit" 
                  class="text-sm text-accent hover:text-[#FF5A4A] transition-colors duration-200 px-4 py-2"
                  onclick="return confirm('Are you sure you want to delete this contact? This action cannot be undone.')"
                >
                  Delete Contact
                </button>
              </form>
            </div>
            
            <button 
              type="submit" 
              class="btn-primary glow-purple text-lg px-8 py-4"
            >
              Save Changes
            </button>
          </div>
        </form>

        {/* Contact Activity Summary */}
        <div class="card bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h3 class="text-lg font-semibold text-[#E3DCD2] mb-4 flex items-center">
            <span class="mr-3">📈</span>
            Contact Summary
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{contact.tags.length}</div>
              <div class="text-[#E3DCD2]/60">Tags</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-secondary">
                {contact.lastContactedAt 
                  ? Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
                  : "N/A"
                }
              </div>
              <div class="text-[#E3DCD2]/60">Days Since Contact</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-accent">
                {Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div class="text-[#E3DCD2]/60">Days in System</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}