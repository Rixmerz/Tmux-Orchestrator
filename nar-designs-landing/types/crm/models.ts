// CRM Data Models

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: 'website' | 'referral' | 'social' | 'cold_outreach' | 'event' | 'other';
  status: 'new' | 'qualified' | 'contacted' | 'nurturing' | 'converted' | 'lost';
  tags: string[];
  notes?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  customFields?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  assignedTo?: string; // User ID
}

export interface Opportunity {
  id: string;
  title: string;
  contactId: string;
  value: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number; // 0-100
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  source: string;
  description?: string;
  tags: string[];
  assignedTo?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  lostReason?: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'proposal_sent' | 'follow_up';
  subject: string;
  description?: string;
  contactId?: string;
  opportunityId?: string;
  userId: string; // Who performed the activity
  scheduledAt?: Date;
  completedAt?: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration?: number; // minutes
  outcome?: string;
  nextAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  name: string;
  contactId: string;
  opportunityId?: string;
  value: number;
  currency: string;
  status: 'pending' | 'signed' | 'completed' | 'cancelled';
  contractDate?: Date;
  startDate?: Date;
  endDate?: Date;
  deliverables: string[];
  paymentTerms?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

// Form interfaces for API requests
export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: string;
  status?: string;
  tags?: string[];
  notes?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  id: string;
}

export interface CreateOpportunityRequest {
  title: string;
  contactId: string;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expectedCloseDate?: Date;
  source: string;
  description?: string;
  tags?: string[];
}

export interface UpdateOpportunityRequest extends Partial<CreateOpportunityRequest> {
  id: string;
}

export interface CreateActivityRequest {
  type: string;
  subject: string;
  description?: string;
  contactId?: string;
  opportunityId?: string;
  scheduledAt?: Date;
  duration?: number;
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {
  id: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  completedAt?: Date;
  outcome?: string;
  nextAction?: string;
}

// Analytics and reporting interfaces
export interface CRMStats {
  totalContacts: number;
  newContactsThisMonth: number;
  totalOpportunities: number;
  totalPipelineValue: number;
  averageDealSize: number;
  conversionRate: number;
  activitiesThisWeek: number;
  contactsByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface ContactFilters {
  status?: string;
  source?: string;
  company?: string;
  assignedTo?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OpportunityFilters {
  stage?: string;
  assignedTo?: string;
  contactId?: string;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityFilters {
  type?: string;
  status?: string;
  contactId?: string;
  opportunityId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}