import { getKv, generateId, getCurrentTimestamp } from "../kv/kv.ts";
import type { Contact, CreateContactRequest, UpdateContactRequest, ContactFilters } from "../../types/crm/models.ts";

export class ContactService {
  private async getKv() {
    return await getKv();
  }

  // Create contact
  async createContact(data: CreateContactRequest, userId: string): Promise<Contact> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    
    const contact: Contact = {
      id: generateId(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      source: data.source as any,
      status: (data.status as any) || 'new',
      tags: data.tags || [],
      notes: data.notes,
      socialLinks: data.socialLinks,
      address: data.address,
      customFields: {},
      createdAt: now,
      updatedAt: now,
      assignedTo: userId,
    };

    // Store contact with multiple keys for different queries
    const result = await kv.atomic()
      .set(["contacts", contact.id], contact)
      .set(["contacts_by_email", contact.email], contact.id)
      .set(["contacts_by_status", contact.status, contact.id], contact)
      .set(["contacts_by_company", contact.company || "unknown", contact.id], contact)
      .set(["contacts_by_source", contact.source, contact.id], contact)
      .set(["contacts_by_assigned", contact.assignedTo || "unassigned", contact.id], contact)
      .commit();

    if (!result.ok) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  // Get contact by ID
  async getContactById(id: string): Promise<Contact | null> {
    const kv = await this.getKv();
    const result = await kv.get<Contact>(["contacts", id]);
    return result.value;
  }

  // Get contact by email
  async getContactByEmail(email: string): Promise<Contact | null> {
    const kv = await this.getKv();
    const idResult = await kv.get<string>(["contacts_by_email", email]);
    if (!idResult.value) return null;
    
    return this.getContactById(idResult.value);
  }

  // Update contact
  async updateContact(data: UpdateContactRequest): Promise<Contact | null> {
    const kv = await this.getKv();
    const existing = await this.getContactById(data.id);
    
    if (!existing) return null;

    const now = getCurrentTimestamp();
    
    const updated: Contact = {
      ...existing,
      ...data,
      updatedAt: now,
      lastContactedAt: data.email !== existing.email ? now : existing.lastContactedAt,
    };

    // Handle email change
    let atomic = kv.atomic()
      .set(["contacts", updated.id], updated)
      .set(["contacts_by_status", updated.status, updated.id], updated)
      .set(["contacts_by_company", updated.company || "unknown", updated.id], updated)
      .set(["contacts_by_source", updated.source, updated.id], updated)
      .set(["contacts_by_assigned", updated.assignedTo || "unassigned", updated.id], updated);

    // If email changed, update email mapping and remove old one
    if (updated.email !== existing.email) {
      atomic = atomic
        .set(["contacts_by_email", updated.email], updated.id)
        .delete(["contacts_by_email", existing.email]);
    } else {
      atomic = atomic.set(["contacts_by_email", updated.email], updated.id);
    }

    // Clean up old indexes if they changed
    if (existing.status !== updated.status) {
      atomic = atomic.delete(["contacts_by_status", existing.status, updated.id]);
    }
    if (existing.company !== updated.company) {
      atomic = atomic.delete(["contacts_by_company", existing.company || "unknown", updated.id]);
    }
    if (existing.source !== updated.source) {
      atomic = atomic.delete(["contacts_by_source", existing.source, updated.id]);
    }
    if (existing.assignedTo !== updated.assignedTo) {
      atomic = atomic.delete(["contacts_by_assigned", existing.assignedTo || "unassigned", updated.id]);
    }

    const result = await atomic.commit();
    
    if (!result.ok) {
      throw new Error("Failed to update contact");
    }

    return updated;
  }

  // Delete contact
  async deleteContact(id: string): Promise<boolean> {
    const kv = await this.getKv();
    const existing = await this.getContactById(id);
    
    if (!existing) return false;

    const result = await kv.atomic()
      .delete(["contacts", id])
      .delete(["contacts_by_email", existing.email])
      .delete(["contacts_by_status", existing.status, id])
      .delete(["contacts_by_company", existing.company || "unknown", id])
      .delete(["contacts_by_source", existing.source, id])
      .delete(["contacts_by_assigned", existing.assignedTo || "unassigned", id])
      .commit();

    return result.ok;
  }

  // List contacts with filters
  async listContacts(filters: ContactFilters = {}): Promise<Contact[]> {
    const kv = await this.getKv();
    const contacts: Contact[] = [];
    
    let prefix: string[];
    if (filters.status) {
      prefix = ["contacts_by_status", filters.status];
    } else if (filters.company) {
      prefix = ["contacts_by_company", filters.company];
    } else if (filters.source) {
      prefix = ["contacts_by_source", filters.source];
    } else if (filters.assignedTo) {
      prefix = ["contacts_by_assigned", filters.assignedTo];
    } else {
      prefix = ["contacts"];
    }

    let count = 0;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    for await (const entry of kv.list<Contact>({ prefix })) {
      if (count < offset) {
        count++;
        continue;
      }
      
      if (contacts.length >= limit) break;
      
      // If we're using an index, get the full contact
      let contact: Contact;
      if (prefix.length > 1) {
        const contactData = await this.getContactById(entry.key[entry.key.length - 1] as string);
        if (!contactData) continue;
        contact = contactData;
      } else {
        contact = entry.value;
      }

      // Apply additional filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = contact.email.toLowerCase();
        const company = (contact.company || "").toLowerCase();
        
        if (!fullName.includes(searchTerm) && 
            !email.includes(searchTerm) && 
            !company.includes(searchTerm)) {
          continue;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => contact.tags.includes(tag));
        if (!hasTag) continue;
      }

      contacts.push(contact);
      count++;
    }

    return contacts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Search contacts
  async searchContacts(query: string, filters: ContactFilters = {}): Promise<Contact[]> {
    const contacts = await this.listContacts({ ...filters, search: query });
    return contacts;
  }

  // Get contact statistics
  async getContactStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    newThisMonth: number;
  }> {
    const kv = await this.getKv();
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      newThisMonth: 0,
    };

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for await (const entry of kv.list<Contact>({ prefix: ["contacts"] })) {
      const contact = entry.value;
      stats.total++;

      // Count by status
      stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;

      // Count by source
      stats.bySource[contact.source] = (stats.bySource[contact.source] || 0) + 1;

      // Count new this month
      if (contact.createdAt >= firstOfMonth) {
        stats.newThisMonth++;
      }
    }

    return stats;
  }

  // Get recent contacts
  async getRecentContacts(limit: number = 10): Promise<Contact[]> {
    const contacts = await this.listContacts({ limit });
    return contacts.slice(0, limit);
  }

  // Update contact status
  async updateContactStatus(id: string, status: Contact['status']): Promise<boolean> {
    const contact = await this.getContactById(id);
    if (!contact) return false;

    const updated = await this.updateContact({ id, status });
    return !!updated;
  }

  // Add note to contact
  async addContactNote(id: string, note: string): Promise<boolean> {
    const contact = await this.getContactById(id);
    if (!contact) return false;

    const existingNotes = contact.notes || "";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;
    const notes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;

    const updated = await this.updateContact({ id, notes });
    return !!updated;
  }
}