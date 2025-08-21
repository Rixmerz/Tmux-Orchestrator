// CMS Content Types

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Content {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  type: 'page' | 'post' | 'project';
  author: string; // User ID
  featuredImage?: string;
  tags: string[];
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    customCSS?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  description?: string;
  uploadedBy: string; // User ID
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Form interfaces for API requests
export interface CreateContentRequest {
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  type: 'page' | 'post' | 'project';
  featuredImage?: string;
  tags: string[];
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    customCSS?: string;
  };
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  id: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'passwordHash'>;
  error?: string;
}