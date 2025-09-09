# Jira Integration Documentation

## Overview
Enable seamless integration between support issues and Jira bug tracking, allowing support teams to escalate customer issues to development teams while maintaining bidirectional synchronization and visibility.

## Integration Features

### 1. Issue to Jira Bug Creation
**Description**: Convert support issues into Jira bugs when escalation to development is needed.

**Workflow**:
1. Support agent identifies issue requires development attention
2. Agent clicks "Create Jira Bug" on issue detail page
3. System creates Jira issue with pre-populated fields from support issue
4. Bidirectional link established between support issue and Jira bug
5. Status synchronization begins

**Trigger Scenarios**:
- Manual escalation by support agent
- Automatic escalation based on rules (multiple occurrences, priority, category)
- Customer-reported bugs that need developer attention
- Feature requests requiring development work

### 2. Bidirectional Synchronization
**Description**: Keep support issues and Jira bugs in sync for status, priority, and resolution updates.

**Sync Fields**:
- Status mapping between systems
- Priority level synchronization  
- Resolution notes and comments
- Assignment information
- Time tracking data

### 3. Automatic Bug Detection
**Description**: Use pattern recognition to identify when support issues are likely bugs requiring Jira tickets.

**Detection Rules**:
- Multiple customers reporting similar issues
- Issues with specific keywords (crash, error, broken, not working)
- Issues in "Bug Report" category with high priority
- Recurring issues from the same feature area

## Database Schema Extensions

### Support Issue Updates
```typescript
interface Issue {
  // ... existing fields
  
  // Jira integration fields
  jiraIntegration?: JiraIntegration
  escalationReason?: string
  escalatedBy?: string
  escalatedAt?: string
  autoEscalationTriggered?: boolean
}

interface JiraIntegration {
  jiraIssueKey: string          // e.g., "PROJ-123"
  jiraIssueId: string           // Jira internal ID
  jiraUrl: string               // Direct link to Jira issue
  jiraProject: string           // Jira project key
  jiraIssueType: string         // Bug, Task, Story, etc.
  jiraStatus: string            // Current Jira status
  jiraPriority: string          // Jira priority level
  jiraAssignee?: string         // Jira assignee username
  createdAt: string             // When link was created
  lastSyncAt: string            // Last sync timestamp
  syncEnabled: boolean          // Enable/disable sync
  syncErrors?: SyncError[]      // Track sync failures
}

interface SyncError {
  timestamp: string
  errorType: 'auth' | 'network' | 'mapping' | 'validation'
  message: string
  retryCount: number
}
```

### Jira Configuration
```typescript
interface OrganizationSettings {
  // ... existing settings
  
  jiraIntegration?: JiraSettings
}

interface JiraSettings {
  enabled: boolean
  baseUrl: string               // https://company.atlassian.net
  username: string              // Service account email
  apiToken: string              // Encrypted API token
  defaultProject: string        // Default project key
  
  // Field mappings
  statusMapping: StatusMapping[]
  priorityMapping: PriorityMapping[]
  issueTypeMapping: IssueTypeMapping[]
  
  // Auto-escalation rules
  autoEscalationRules: EscalationRule[]
  
  // Webhook configuration
  webhookSecret?: string        // For Jira->Support updates
  webhookEnabled: boolean
}

interface StatusMapping {
  supportStatus: IssueStatus
  jiraStatus: string
  bidirectional: boolean
}

interface PriorityMapping {
  supportPriority: IssuePriority
  jiraPriority: string
}

interface IssueTypeMapping {
  supportCategory: string
  jiraIssueType: string
}

interface EscalationRule {
  id: string
  name: string
  enabled: boolean
  conditions: EscalationCondition[]
  actions: EscalationAction[]
}

interface EscalationCondition {
  type: 'category' | 'priority' | 'keyword' | 'customer_count' | 'age'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number
}

interface EscalationAction {
  type: 'create_jira' | 'notify' | 'assign' | 'priority_change'
  config: Record<string, any>
}
```

## API Integration

### Jira REST API Client
```typescript
// lib/jira/client.ts
import { JiraSettings } from '@/types'

export class JiraClient {
  constructor(private settings: JiraSettings) {}
  
  async createIssue(issueData: JiraIssueData): Promise<JiraIssue> {
    const response = await fetch(`${this.settings.baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.settings.username}:${this.settings.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: issueData.projectKey },
          summary: issueData.summary,
          description: issueData.description,
          issuetype: { name: issueData.issueType },
          priority: { name: issueData.priority },
          ...issueData.customFields
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Jira API error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async updateIssue(issueKey: string, updateData: Partial<JiraIssueData>): Promise<void> {
    // Implementation for updating Jira issues
  }
  
  async getIssue(issueKey: string): Promise<JiraIssue> {
    // Implementation for fetching Jira issue details
  }
  
  async addComment(issueKey: string, comment: string): Promise<void> {
    // Implementation for adding comments to Jira issues
  }
}

interface JiraIssueData {
  projectKey: string
  summary: string
  description: string
  issueType: string
  priority: string
  customFields?: Record<string, any>
}

interface JiraIssue {
  id: string
  key: string
  self: string
  fields: {
    summary: string
    description: string
    status: { name: string }
    priority: { name: string }
    assignee?: { displayName: string; accountId: string }
    created: string
    updated: string
  }
}
```

### Server Actions for Jira Integration
```typescript
// app/actions/jira.ts
'use server'

import { requirePermission } from '@/lib/stytch/session'
import { JiraClient } from '@/lib/jira/client'
import { dbQueries } from '@/lib/cosmos/queries'

export async function createJiraIssueFromSupport(issueId: string, escalationReason: string) {
  const session = await requirePermission('issues:write')
  
  // Get support issue
  const issue = await dbQueries.getItem<Issue>('issues', issueId, session.organizationId)
  if (!issue) {
    throw new Error('Issue not found')
  }
  
  // Get Jira settings
  const org = await dbQueries.getItem<Organization>('organizations', session.organizationId, session.organizationId)
  if (!org?.settings.jiraIntegration?.enabled) {
    throw new Error('Jira integration not configured')
  }
  
  const jiraClient = new JiraClient(org.settings.jiraIntegration)
  
  // Map support issue to Jira issue
  const jiraIssueData = mapSupportIssueToJira(issue, org.settings.jiraIntegration)
  
  try {
    // Create Jira issue
    const jiraIssue = await jiraClient.createIssue(jiraIssueData)
    
    // Update support issue with Jira integration info
    await dbQueries.updateItem<Issue>('issues', issueId, {
      jiraIntegration: {
        jiraIssueKey: jiraIssue.key,
        jiraIssueId: jiraIssue.id,
        jiraUrl: `${org.settings.jiraIntegration.baseUrl}/browse/${jiraIssue.key}`,
        jiraProject: jiraIssueData.projectKey,
        jiraIssueType: jiraIssueData.issueType,
        jiraStatus: jiraIssue.fields.status.name,
        jiraPriority: jiraIssue.fields.priority.name,
        createdAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        syncEnabled: true
      },
      escalationReason,
      escalatedBy: session.userId,
      escalatedAt: new Date().toISOString()
    }, session.organizationId)
    
    return { success: true, jiraKey: jiraIssue.key, jiraUrl: `${org.settings.jiraIntegration.baseUrl}/browse/${jiraIssue.key}` }
  } catch (error) {
    console.error('Failed to create Jira issue:', error)
    throw new Error('Failed to create Jira issue')
  }
}

export async function syncJiraIssue(issueId: string) {
  const session = await requirePermission('issues:write')
  
  const issue = await dbQueries.getItem<Issue>('issues', issueId, session.organizationId)
  if (!issue?.jiraIntegration) {
    throw new Error('No Jira integration found for this issue')
  }
  
  // Fetch latest Jira data and sync
  // Implementation for bidirectional sync
}

function mapSupportIssueToJira(issue: Issue, jiraSettings: JiraSettings): JiraIssueData {
  // Map priority
  const priorityMapping = jiraSettings.priorityMapping.find(p => p.supportPriority === issue.priority)
  const jiraPriority = priorityMapping?.jiraPriority || 'Medium'
  
  // Map issue type based on category
  const typeMapping = jiraSettings.issueTypeMapping.find(t => t.supportCategory === issue.categoryId)
  const issueType = typeMapping?.jiraIssueType || 'Bug'
  
  return {
    projectKey: jiraSettings.defaultProject,
    summary: `[Support] ${issue.title}`,
    description: createJiraDescription(issue),
    issueType,
    priority: jiraPriority,
    customFields: {
      // Add custom fields like customer info, support ticket ID, etc.
      'customfield_10000': issue.id, // Support ticket ID
      'customfield_10001': issue.customerName // Customer name
    }
  }
}

function createJiraDescription(issue: Issue): string {
  return `
*Original Support Issue:* ${issue.id}
*Customer:* ${issue.customerName} (${issue.customerEmail})
*Priority:* ${issue.priority}
*Created:* ${new Date(issue.createdAt).toLocaleDateString()}

*Description:*
${issue.description}

---
_This Jira issue was automatically created from a support ticket. Updates will be synchronized between systems._
  `.trim()
}
```

## Webhook Integration

### Jira to Support Sync
```typescript
// app/api/webhooks/jira/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbQueries } from '@/lib/cosmos/queries'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature')
  const body = await request.json()
  
  // Verify webhook signature
  if (!verifyJiraWebhookSignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const { issue, changelog, webhookEvent } = body
  
  // Find linked support issue
  const supportIssue = await findSupportIssueByJiraKey(issue.key)
  if (!supportIssue) {
    return NextResponse.json({ error: 'No linked support issue found' }, { status: 404 })
  }
  
  // Process different webhook events
  switch (webhookEvent) {
    case 'jira:issue_updated':
      await syncJiraUpdateToSupport(supportIssue, issue, changelog)
      break
    case 'jira:issue_deleted':
      await handleJiraIssueDeletion(supportIssue, issue)
      break
  }
  
  return NextResponse.json({ success: true })
}

async function syncJiraUpdateToSupport(supportIssue: Issue, jiraIssue: any, changelog: any) {
  const updates: Partial<Issue> = {}
  
  // Check for status changes
  const statusChange = changelog.items.find((item: any) => item.field === 'status')
  if (statusChange) {
    const newSupportStatus = mapJiraStatusToSupport(statusChange.toString)
    if (newSupportStatus) {
      updates.status = newSupportStatus
    }
  }
  
  // Check for priority changes
  const priorityChange = changelog.items.find((item: any) => item.field === 'priority')
  if (priorityChange) {
    const newSupportPriority = mapJiraPriorityToSupport(priorityChange.toString)
    if (newSupportPriority) {
      updates.priority = newSupportPriority
    }
  }
  
  // Update Jira integration metadata
  updates.jiraIntegration = {
    ...supportIssue.jiraIntegration!,
    jiraStatus: jiraIssue.fields.status.name,
    jiraPriority: jiraIssue.fields.priority.name,
    jiraAssignee: jiraIssue.fields.assignee?.displayName,
    lastSyncAt: new Date().toISOString()
  }
  
  if (Object.keys(updates).length > 0) {
    await dbQueries.updateItem<Issue>('issues', supportIssue.id, updates, supportIssue.organizationId)
  }
}
```

## User Interface Components

### Jira Integration Panel
```typescript
// components/issues/JiraIntegrationPanel.tsx
import { Issue } from '@/types'
import { createJiraIssueFromSupport, syncJiraIssue } from '@/app/actions/jira'

interface JiraIntegrationPanelProps {
  issue: Issue
}

export function JiraIntegrationPanel({ issue }: JiraIntegrationPanelProps) {
  if (issue.jiraIntegration) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-blue-900">Linked Jira Issue</h3>
          <form action={syncJiraIssue.bind(null, issue.id)}>
            <button 
              type="submit"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Sync Status
            </button>
          </form>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Jira Key:</span>
            <a 
              href={issue.jiraIntegration.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              {issue.jiraIntegration.jiraIssueKey}
            </a>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className="ml-2">{issue.jiraIntegration.jiraStatus}</span>
          </div>
          <div>
            <span className="font-medium">Priority:</span>
            <span className="ml-2">{issue.jiraIntegration.jiraPriority}</span>
          </div>
          <div>
            <span className="font-medium">Last Sync:</span>
            <span className="ml-2 text-gray-600">
              {new Date(issue.jiraIntegration.lastSyncAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Escalate to Development</h3>
      <form action={createJiraIssueFromSupport.bind(null, issue.id)}>
        <textarea
          name="escalationReason"
          placeholder="Reason for escalation to development team..."
          className="w-full p-2 border border-gray-300 rounded text-sm mb-3"
          rows={3}
          required
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Create Jira Bug
        </button>
      </form>
    </div>
  )
}
```

## Implementation Priority

### Phase 1: Basic Integration
1. Jira client setup and authentication
2. Manual issue creation from support tickets
3. Basic field mapping configuration
4. Simple status display

### Phase 2: Bidirectional Sync
1. Webhook endpoint for Jira updates
2. Status and priority synchronization
3. Comment synchronization
4. Error handling and retry logic

### Phase 3: Advanced Features
1. Auto-escalation rules
2. Pattern recognition for bug detection
3. Bulk operations and reporting
4. Advanced field mapping and customization

## Security Considerations

1. **API Token Management**: Store Jira API tokens encrypted
2. **Webhook Verification**: Verify webhook signatures to prevent spoofing
3. **Permission Checks**: Ensure only authorized users can create/sync Jira issues
4. **Rate Limiting**: Implement rate limiting for Jira API calls
5. **Error Logging**: Log integration errors without exposing sensitive data

This Jira integration would provide a seamless bridge between customer support and development teams, ensuring issues are properly escalated and tracked across both systems while maintaining data consistency and visibility.