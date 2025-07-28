import { Handlers, PageProps } from "$fresh/server.ts";
import AdminLayout from "../../../components/layout/AdminLayout.tsx";
import { AuthService } from "../../../lib/auth/authService.ts";
import { ContentService } from "../../../lib/cms/contentService.ts";

interface NewContentData {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  error?: string;
}

export const handler: Handlers<NewContentData> = {
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
      const formData = await req.formData();
      
      const title = formData.get("title")?.toString();
      const content = formData.get("content")?.toString();
      const excerpt = formData.get("excerpt")?.toString();
      const status = formData.get("status")?.toString() as "draft" | "published";
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
          error: "Title, content, status, and type are required",
        });
      }

      const newContent = await contentService.createContent({
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
      }, user.id);

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
        error: error.message || "Failed to create content",
      });
    }
  }
};

export default function NewContent({ data }: PageProps<NewContentData>) {
  const { user, error } = data;

  return (
    <AdminLayout currentPath="/admin/content" user={user}>
      <div class="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-[#E3DCD2]">Create New Content</h1>
            <p class="text-[#E3DCD2]/70 mt-2">// Bring your ideas to life</p>
          </div>
          <a href="/admin/content" class="btn-ghost">
            ← Back to Content
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
                    <option value="">Choose type</option>
                    <option value="post">Blog Post</option>
                    <option value="page">Static Page</option>
                    <option value="project">Portfolio Project</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#E3DCD2]/80 mb-2">
                    Status *
                  </label>
                  <select name="status" class="input" required>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
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
                ></textarea>
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
                  class="input"
                  placeholder="design, frontend, creative, portfolio..."
                />
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Separate multiple tags with commas
                </p>
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
                placeholder="Write your content here...

You can use Markdown syntax:
# Heading 1
## Heading 2
**Bold text**
*Italic text*
[Link text](https://example.com)
![Image alt](image-url)

Or write in HTML for more control..."
                required
              ></textarea>
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
                ></textarea>
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
                  placeholder="/* Custom styles for this content */
.custom-class {
  background: #A259FF;
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
}"
                ></textarea>
                <p class="text-xs text-[#E3DCD2]/60 mt-1 font-mono">
                  // Advanced: Custom CSS for this content only
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex justify-between items-center pt-6">
            <a href="/admin/content" class="btn-ghost">
              Cancel
            </a>
            
            <div class="flex space-x-4">
              <button 
                type="submit" 
                name="status" 
                value="draft"
                class="btn-secondary glow-blue"
              >
                Save as Draft
              </button>
              <button 
                type="submit" 
                name="status" 
                value="published"
                class="btn-primary glow-purple"
              >
                Publish Now
              </button>
            </div>
          </div>
        </form>

        {/* Help Section */}
        <div class="card bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h3 class="text-lg font-semibold text-[#E3DCD2] mb-4 flex items-center">
            <span class="mr-3">💡</span>
            Content Creation Tips
          </h3>
          <div class="space-y-2 text-sm text-[#E3DCD2]/80">
            <p><strong class="text-primary">Drafts</strong> are saved but not visible to visitors</p>
            <p><strong class="text-secondary">Published</strong> content is immediately live on your site</p>
            <p><strong class="text-accent">Tags</strong> help organize and categorize your content</p>
            <p class="font-mono text-xs text-[#E3DCD2]/60">// Remember: you can always edit content after creating it</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}