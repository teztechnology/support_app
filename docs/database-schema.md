# Database Schema Documentation

## Overview
The application uses Azure Cosmos DB with a multi-tenant architecture. Each organization's data is partitioned using `organizationId` as the partition key for optimal performance and data isolation.

## Container Structure

### Core Containers
- `organizations` - Organization/tenant data
- `users` - User accounts and permissions  
- `customers` - Customer/client information
- `issues` - Support tickets and requests
- `comments` - Issue comments and updates
- `categories` - Issue categories and classification
- `attachments` - File attachments metadata

## Schema Definitions

### Organizations
```typescript
interface Organization {
  id: string                    // Unique organization identifier
  name: string                  // Organization display name
  domain?: string               // Email domain for auto-assignment
  settings: OrganizationSettings
  isActive: boolean
  createdAt: string            // ISO timestamp
  updatedAt: string            // ISO timestamp
  
  // Cosmos DB partition key
  organizationId: string       // Same as id for top-level docs
}

interface OrganizationSettings {
  timezone: string
  businessHours: BusinessHours
  slaRules: SLARule[]
  autoAssignmentRules: AutoAssignmentRule[]
  emailSettings: EmailSettings
  customFields: CustomField[]
}
```

### Users
```typescript
interface User {
  id: string                   // User identifier
  name: string                 // Display name
  email: string                // Email address
  role: 'admin' | 'support_agent' | 'read_only'
  organizationId: string       // Partition key
  stytchMemberId: string       // Stytch member ID for auth
  permissions: string[]        // Permission array
  isActive: boolean
  lastLoginAt?: string
  workloadSettings: WorkloadSettings
  notificationPreferences: NotificationPreferences
  createdAt: string
  updatedAt: string
}

interface WorkloadSettings {
  maxAssignedIssues?: number
  availableHours: BusinessHours
  autoAssignment: boolean
  categories: string[]         // Categories this user can handle
}
```

### Customers
```typescript
interface Customer {
  id: string                   // Customer identifier
  name: string                 // Customer name
  email: string                // Primary contact email
  organizationId: string       // Partition key
  company?: string
  phone?: string
  tier: 'basic' | 'premium' | 'enterprise'
  tags: string[]
  customFields: Record<string, any>
  totalIssues: number
  resolvedIssues: number
  avgResponseTime?: number     // In minutes
  createdAt: string
  updatedAt: string
}
```

### Issues
```typescript
interface Issue {
  id: string                   // Issue identifier
  organizationId: string       // Partition key
  title: string                // Issue title/subject
  description: string          // Detailed description
  status: IssueStatus
  priority: IssuePriority
  
  // Customer information
  customerId: string           // Reference to customer
  customerEmail: string        // For quick lookup
  customerName: string         // Denormalized for performance
  
  // Assignment
  assignedTo?: string          // User ID of assignee
  assignedAt?: string          // When assigned
  assignedBy?: string          // Who assigned it
  assignmentHistory: AssignmentHistoryEntry[]
  
  // Categorization
  categoryId?: string          // Primary category
  subcategoryId?: string       // Subcategory if applicable
  tags: string[]               // Flexible tagging
  
  // Duplicate/Related tracking
  parentIssueId?: string       // For duplicates
  relatedIssueIds: string[]    // Related issues
  duplicateCount: number       // How many times duplicated
  
  // Timestamps
  createdAt: string
  updatedAt: string
  firstResponseAt?: string     // SLA tracking
  resolvedAt?: string
  closedAt?: string
  
  // Custom fields based on category
  customFields: Record<string, any>
  
  // Metrics
  responseTime?: number        // Minutes to first response
  resolutionTime?: number      // Minutes to resolution
  reopenCount: number
}

type IssueStatus = 
  | 'open' 
  | 'in_progress' 
  | 'pending_customer' 
  | 'resolved' 
  | 'closed'

type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

interface AssignmentHistoryEntry {
  userId: string
  assignedBy: string
  assignedAt: string
  unassignedAt?: string
  reason?: string
}
```

### Comments
```typescript
interface Comment {
  id: string                   // Comment identifier
  organizationId: string       // Partition key
  issueId: string             // Parent issue
  authorId: string            // User who created comment
  authorName: string          // Denormalized for performance
  content: string             // Comment text
  isInternal: boolean         // Internal note vs customer-visible
  attachmentIds: string[]     // References to attachments
  createdAt: string
  updatedAt?: string
}
```

### Categories
```typescript
interface IssueCategory {
  id: string                   // Category identifier
  organizationId: string       // Partition key
  name: string                 // Category name
  description: string
  color: string               // Hex color for UI
  parentCategoryId?: string   // For subcategories
  isActive: boolean
  sortOrder: number
  
  // Auto-assignment rules
  defaultAssigneeId?: string
  defaultPriority?: IssuePriority
  
  // SLA rules specific to this category
  slaRules: CategorySLARule[]
  
  // Custom fields for this category
  customFields: CategoryField[]
  
  createdAt: string
  updatedAt: string
}

interface CategoryField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox'
  required: boolean
  options?: string[]           // For select/multiselect
  defaultValue?: any
  validation?: FieldValidation
}

interface CategorySLARule {
  responseTimeMinutes: number
  resolutionTimeMinutes: number
  businessHoursOnly: boolean
}
```

### Attachments
```typescript
interface Attachment {
  id: string                   // Attachment identifier
  organizationId: string       // Partition key
  issueId?: string            // Parent issue (optional)
  commentId?: string          // Parent comment (optional)
  filename: string            // Original filename
  contentType: string         // MIME type
  size: number                // File size in bytes
  storageUrl: string          // URL to file in blob storage
  uploadedBy: string          // User ID
  uploadedAt: string
  isActive: boolean           // For soft delete
}
```

## Indexes and Performance

### Required Indexes
```typescript
// Issues container
{
  path: "/organizationId",
  kind: "Hash"
}
{
  path: "/customerId", 
  kind: "Hash"
}
{
  path: "/assignedTo",
  kind: "Hash"
}
{
  path: "/status",
  kind: "Hash"
}
{
  path: "/createdAt",
  kind: "Range"
}

// Comments container  
{
  path: "/organizationId",
  kind: "Hash"
}
{
  path: "/issueId",
  kind: "Hash"
}
```

### Query Patterns
- List issues by organization: `WHERE c.organizationId = @orgId`
- Get customer issues: `WHERE c.organizationId = @orgId AND c.customerId = @customerId`
- Get assigned issues: `WHERE c.organizationId = @orgId AND c.assignedTo = @userId`
- Recent issues: `WHERE c.organizationId = @orgId ORDER BY c.createdAt DESC`

## Migration Strategy

### Phase 1: Core Schema
1. Organizations, Users, Customers, Issues
2. Basic issue management functionality

### Phase 2: Enhanced Features  
1. Categories and custom fields
2. Assignment history tracking
3. Comments and attachments

### Phase 3: Advanced Features
1. SLA rules and metrics
2. Duplicate detection
3. Advanced reporting schema