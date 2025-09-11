export type IssueStatus =
  | "new"
  | "in_progress"
  | "awaiting_customer"
  | "resolved"
  | "closed";
export type IssuePriority = "critical" | "high" | "medium" | "low";
export type UserRole = "admin" | "support_agent" | "read_only";

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category?: string;
  applicationId?: string;
  customerId: string;
  assignedToId?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  attachments: string[];
  _ts?: number;
  _etag?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  organizationId: string;
  totalIssues: number;
  createdAt: string;
  updatedAt: string;
  _ts?: number;
  _etag?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  stytchMemberId: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  _ts?: number;
  _etag?: string;
}

export interface Organization {
  id: string;
  name: string;
  stytchOrganizationId: string;
  domain?: string;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _ts?: number;
  _etag?: string;
}

export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  defaultUserRole: UserRole;
  requireApproval: boolean;
  customFields: CustomField[];
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "boolean" | "select" | "date";
  required: boolean;
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  applicationId: string;
  isActive: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
  _ts?: number;
  _etag?: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _ts?: number;
  _etag?: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  attachments: string[];
  organizationId: string;
  _ts?: number;
  _etag?: string;
}

export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  averageResolutionTime: number;
  issuesByStatus: Record<IssueStatus, number>;
  issuesByPriority: Record<IssuePriority, number>;
  trendsData: TrendData[];
  recentActivity: ActivityItem[];
}

export interface TrendData {
  date: string;
  created: number;
  resolved: number;
}

export interface ActivityItem {
  id: string;
  type: "issue_created" | "issue_updated" | "issue_resolved" | "comment_added";
  title: string;
  description: string;
  userId: string;
  userName: string;
  issueId?: string;
  timestamp: string;
}

export interface SessionData {
  userId: string;
  organizationId: string;
  stytchOrganizationId: string;
  stytchSessionId: string;
  stytchMemberId: string;
  userRole: UserRole;
  permissions: string[];
  organizationName: string;
  userName: string;
  userEmail: string;
  expiresAt: string;
}

export interface FilterParams {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  assignedToId?: string;
  customerId?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface CosmosDbConfig {
  endpoint: string;
  key: string;
  databaseId: string;
}

export interface StytchConfig {
  projectId: string;
  secret: string;
  publicToken: string;
}

export type ReportType =
  | "issues_summary"
  | "team_performance"
  | "customer_satisfaction"
  | "resolution_times";

export interface ReportFilters {
  organizationId: string;
  dateRange: {
    start: string;
    end: string;
  };
  teamMemberIds?: string[];
  customerIds?: string[];
  categories?: string[];
  priorities?: IssuePriority[];
}
