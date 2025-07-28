import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../../lib/auth/authService.ts";
import { ContentService } from "../../../../lib/cms/contentService.ts";
import type { Content } from "../../../../types/cms/content.ts";

interface EditContentData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  content: Content;
  error?: string;
}

export const handler: Handlers<EditContentData> = {
  async GET(req, ctx) {
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

    // Get content by ID
    const contentId = ctx.params.id;
    const content = await contentService.getContentById(contentId);
    
    if (!content) {
      return new Response("Content not found", { status: 404 });
    }

    return ctx.render({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      content,
    });
  },

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

    const contentId = ctx.params.id;
    const existingContent = await contentService.getContentById(contentId);
    
    if (!existingContent) {
      return new Response("Content not found", { status: 404 });
    }

    try {
      const formData = await req.formData();
      
      const title = formData.get("title")?.toString();
      const content = formData.get("content")?.toString();
      const excerpt = formData.get("excerpt")?.toString();
      const status = formData.get("status")?.toString() as "draft" | "published" | "archived";
      const type = formData.get("type")?.toString() as "page" | "post" | "project";
      const tags = formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [];
      const seoTitle = formData.get("seoTitle")?.toString();
      const seoDescription = formData.get("seoDescription")?.toString();
      const customCSS = formData.get("customCSS")?.toString();

      if (!title || !content || !status || !type) {
        return ctx.render({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          content: existingContent,
          error: "Title, content, status, and type are required",
        });
      }

      await contentService.updateContent({
        id: contentId,
        title,
        content,
        excerpt: excerpt || undefined,
        status,
        type,
        tags,
        metadata: {
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          customCSS: customCSS || undefined,
        },
      });

      const url = new URL(req.url);
      return Response.redirect(new URL("/admin/content", url.origin));
    } catch (error) {
      return ctx.render({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        content: existingContent,
        error: error.message || "Failed to update content",
      });
    }
  }
};

export default function EditContent({ data }: PageProps<EditContentData>) {
  const { user, content, error } = data;

  return (
    <AdminLayout currentPath="/admin/content" user={user}>
      <div class="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Edit Content</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Refining your creative vision</p>
          </div>
          <div class="flex space-x-3">
            {content.status === 'published' && (
              <a 
                href={`/${content.slug}`} 
                target="_blank"
                class="btn-secondary glow-blue"
              >
                View Live →
              </a>
            )}
            <a href="/admin/content" class="btn-ghost">
              ← Back to Content
            </a>
          </div>
        </div>

        {/* Content Status Badge */}
        <div class="flex items-center space-x-4">
          <div class={`px-4 py-2 rounded-lg font-mono text-sm ${
            content.status === 'published' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
            content.status === 'draft' ? 'bg-accent/20 text-accent border border-accent/30' :
            'bg-[#E3DCD2]/20 text-[#E3DCD2] border border-[#E3DCD2]/30'
          }`}>
            {content.status.toUpperCase()}
          </div>
          <div class="text-sm text-[#E3DCD2]/60 font-mono">
            Created: {new Date(content.createdAt).toLocaleDateString()} | 
            Updated: {new Date(content.updatedAt).toLocaleDateString()}
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
              <span class="mr-3">📝</span>
              Basic Information
            </h2>
            
            <div class="space-y-6">
              {/* Title */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Title *
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={content.title}
                  class="input text-lg"
                  placeholder="Enter a compelling title..."
                  required
                />
              </div>

              {/* Type and Status */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Content Type *
                  </label>
                  <select name="type" class="input" required>
                    <option value="post" selected={content.type === "post"}>Blog Post</option>
                    <option value="page" selected={content.type === "page"}>Static Page</option>
                    <option value="project" selected={content.type === "project"}>Portfolio Project</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Status *
                  </label>
                  <select name="status" class="input" required>
                    <option value="draft" selected={content.status === "draft"}>Draft</option>
                    <option value="published" selected={content.status === "published"}>Published</option>
                    <option value="archived" selected={content.status === "archived"}>Archived</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Excerpt
                </label>
                <textarea 
                  name="excerpt"
                  rows="3"
                  class="input resize-none"
                  placeholder="Brief description or summary..."
                >{content.excerpt || ""}</textarea>
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Optional: Used for previews and SEO
                </p>
              </div>

              {/* Tags */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Tags
                </label>
                <input 
                  type="text" 
                  name="tags"
                  value={content.tags.join(", ")}
                  class="input"
                  placeholder="design, frontend, creative, portfolio..."
                />
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Separate multiple tags with commas
                </p>
              </div>

              {/* Slug Preview */}
              <div class="p-4 bg-[#0D0D0D]/30 rounded-lg border border-[#E3DCD2]/10">
                <div class="text-sm text-[#E3DCD2]/60 font-mono mb-1">// URL Slug:</div>
                <div class="text-secondary font-mono">/{content.slug}</div>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div class="card">
            <h2 class="text-xl font-semibold text-[#E3DCD2] mb-6 flex items-center">
              <span class="mr-3">✏️</span>
              Content
            </h2>
            
            <div>
              <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                Content *
              </label>
              <textarea 
                name="content"
                rows="20"
                class="input resize-y font-mono text-sm"
                placeholder="Write your content here..."
                required
              >{content.content}</textarea>
              <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                // Supports Markdown and HTML
              </p>
            </div>
          </div>

          {/* SEO & Advanced */}
          <div class="card">
            <h2 class="text-xl font-semibold text-[#E3DCD2] mb-6 flex items-center">
              <span class="mr-3">🔍</span>
              SEO & Advanced Options
            </h2>
            
            <div class="space-y-6">
              {/* SEO Title */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  SEO Title
                </label>
                <input 
                  type="text" 
                  name="seoTitle"
                  value={content.metadata.seoTitle || ""}
                  class="input"
                  placeholder="Custom title for search engines..."
                />
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Leave empty to use the main title
                </p>
              </div>

              {/* SEO Description */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  SEO Description
                </label>
                <textarea 
                  name="seoDescription"
                  rows="3"
                  class="input resize-none"
                  placeholder="Description for search engines and social media..."
                >{content.metadata.seoDescription || ""}</textarea>
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Optimal length: 150-160 characters
                </p>
              </div>

              {/* Custom CSS */}
              <div>
                <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                  Custom CSS
                </label>
                <textarea 
                  name="customCSS"
                  rows="8"
                  class="input resize-y font-mono text-sm"
                  placeholder="/* Custom styles for this content */"
                >{content.metadata.customCSS || ""}</textarea>
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Advanced: Custom CSS for this content only
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex justify-between items-center pt-6">
            <div class="flex space-x-4">
              <a href="/admin/content" class="btn-ghost">
                Cancel
              </a>
              <form method="POST" action={`/admin/content/delete/${content.id}`} class="inline">
                <button 
                  type="submit" 
                  class="text-sm text-accent hover:text-[#FF5A4A] transition-colors duration-200 px-4 py-2"
                  onclick="return confirm('Are you sure you want to delete this content? This action cannot be undone.')"
                >
                  Delete Content
                </button>
              </form>
            </div>
            
            <div class="flex space-x-4">
              <button 
                type="submit" 
                class="btn-secondary glow-blue"
              >
                Save Changes
              </button>
              {content.status !== 'published' && (
                <button 
                  type="submit" 
                  name="status" 
                  value="published"
                  class="btn-primary glow-purple"
                >
                  Publish Now
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Content Statistics */}
        <div class="card bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h3 class="text-lg font-semibold text-[#E3DCD2] mb-4 flex items-center">
            <span class="mr-3">📊</span>
            Content Statistics
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{content.content.length}</div>
              <div class="text-[#E3DCD2]/60">Characters</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-secondary">{content.content.split(/\s+/).length}</div>
              <div class="text-[#E3DCD2]/60">Words</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-accent">{Math.ceil(content.content.split(/\s+/).length / 200)}</div>
              <div class="text-[#E3DCD2]/60">Min Read</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}