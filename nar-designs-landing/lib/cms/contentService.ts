import { getKv, generateId, getCurrentTimestamp } from "../kv/kv.ts";
import type { Content, CreateContentRequest, UpdateContentRequest } from "../../types/cms/content.ts";

export class ContentService {
  private async getKv() {
    return await getKv();
  }

  // Create content
  async createContent(data: CreateContentRequest, authorId: string): Promise<Content> {
    const kv = await this.getKv();
    const now = getCurrentTimestamp();
    
    const content: Content = {
      id: generateId(),
      title: data.title,
      slug: this.generateSlug(data.title),
      content: data.content,
      excerpt: data.excerpt,
      status: data.status,
      type: data.type,
      author: authorId,
      featuredImage: data.featuredImage,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? now : undefined,
    };

    // Store content with multiple keys for different queries
    const result = await kv.atomic()
      .set(["content", content.id], content)
      .set(["content_by_slug", content.slug], content.id)
      .set(["content_by_type", content.type, content.id], content)
      .set(["content_by_status", content.status, content.id], content)
      .commit();

    if (!result.ok) {
      throw new Error("Failed to create content");
    }

    return content;
  }

  // Get content by ID
  async getContentById(id: string): Promise<Content | null> {
    const kv = await this.getKv();
    const result = await kv.get<Content>(["content", id]);
    return result.value;
  }

  // Get content by slug
  async getContentBySlug(slug: string): Promise<Content | null> {
    const kv = await this.getKv();
    const idResult = await kv.get<string>(["content_by_slug", slug]);
    if (!idResult.value) return null;
    
    return this.getContentById(idResult.value);
  }

  // Update content
  async updateContent(data: UpdateContentRequest): Promise<Content | null> {
    const kv = await this.getKv();
    const existing = await this.getContentById(data.id);
    
    if (!existing) return null;

    const now = getCurrentTimestamp();
    const newSlug = data.title ? this.generateSlug(data.title) : existing.slug;
    
    const updated: Content = {
      ...existing,
      ...data,
      slug: newSlug,
      updatedAt: now,
      publishedAt: data.status === 'published' && existing.status !== 'published' ? now : existing.publishedAt,
    };

    // Handle slug change
    let atomic = kv.atomic()
      .set(["content", updated.id], updated)
      .set(["content_by_type", updated.type, updated.id], updated)
      .set(["content_by_status", updated.status, updated.id], updated);

    // If slug changed, update slug mapping and remove old one
    if (newSlug !== existing.slug) {
      atomic = atomic
        .set(["content_by_slug", newSlug], updated.id)
        .delete(["content_by_slug", existing.slug]);
    } else {
      atomic = atomic.set(["content_by_slug", newSlug], updated.id);
    }

    // Clean up old status if it changed
    if (existing.status !== updated.status) {
      atomic = atomic.delete(["content_by_status", existing.status, updated.id]);
    }

    const result = await atomic.commit();
    
    if (!result.ok) {
      throw new Error("Failed to update content");
    }

    return updated;
  }

  // Delete content
  async deleteContent(id: string): Promise<boolean> {
    const kv = await this.getKv();
    const existing = await this.getContentById(id);
    
    if (!existing) return false;

    const result = await kv.atomic()
      .delete(["content", id])
      .delete(["content_by_slug", existing.slug])
      .delete(["content_by_type", existing.type, id])
      .delete(["content_by_status", existing.status, id])
      .commit();

    return result.ok;
  }

  // List content with filters
  async listContent(options: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Content[]> {
    const kv = await this.getKv();
    const contents: Content[] = [];
    
    let prefix: string[];
    if (options.type && options.status) {
      prefix = ["content_by_type", options.type];
    } else if (options.status) {
      prefix = ["content_by_status", options.status];
    } else {
      prefix = ["content"];
    }

    let count = 0;
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    for await (const entry of kv.list<Content>({ prefix })) {
      if (count < offset) {
        count++;
        continue;
      }
      
      if (contents.length >= limit) break;
      
      // If we're using an index, get the full content
      if (prefix.length > 1) {
        const content = await this.getContentById(entry.key[entry.key.length - 1] as string);
        if (content) contents.push(content);
      } else {
        contents.push(entry.value);
      }
      
      count++;
    }

    return contents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Generate URL-friendly slug
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Search content
  async searchContent(query: string, options: {
    type?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<Content[]> {
    const contents = await this.listContent(options);
    const searchTerm = query.toLowerCase();
    
    return contents.filter(content => 
      content.title.toLowerCase().includes(searchTerm) ||
      content.content.toLowerCase().includes(searchTerm) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
}