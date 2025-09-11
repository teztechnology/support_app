# Jira & Claude API Integration Plan

## Overview
Integrate Jira and Claude API to enable intelligent escalation of support issues to development teams with AI-generated bug reports and feature scoping.

## Goals
1. **Simplified Jira Integration**: Basic escalation without complex bidirectional sync
2. **AI-Powered Bug Reports**: Use Claude API to generate structured bug reports from support issues
3. **Development Scoping**: AI assistance for feature requests and bug complexity analysis

## Phase 1: Basic Jira Integration

### Dependencies
```json
{
  "axios": "^1.6.0"
}
```

### Environment Variables
```env
# Jira Configuration
JIRA_BASE_URL=https://company.atlassian.net
JIRA_EMAIL=support@company.com
JIRA_API_TOKEN=your_api_token_here
```

### Implementation

#### 1. Service Layer (`/lib/jira/`)

**`client.ts`** - Basic Jira REST API client
```typescript
interface JiraClient {
  createIssue(projectKey: string, issue: JiraIssue): Promise<JiraResponse>
  getProjects(): Promise<Project[]>
  getIssueTypes(projectKey: string): Promise<IssueType[]>
}
```

**`types.ts`** - Essential Jira types
```typescript
interface JiraIssue {
  summary: string
  description: string
  issueType: string
  priority: string
  reporter?: string
}

interface JiraResponse {
  key: string      // e.g., "PROJ-123"
  id: string
  self: string     // URL to issue
}
```

**`actions.ts`** - Server actions for Jira operations
```typescript
export async function escalateToJira(
  issueId: string,
  projectKey: string,
  issueType: string
): Promise<ServerActionResponse>
```

#### 2. Database Updates
Update Issue type to include:
```typescript
interface Issue {
  // ... existing fields
  jiraIssueKey?: string    // e.g., "PROJ-123"
  jiraUrl?: string         // Direct link to Jira issue
  escalatedAt?: string     // When escalated
  escalatedBy?: string     // User who escalated
}
```

#### 3. UI Components
- Add "Escalate to Jira" button in issue detail page
- Modal for selecting Jira project and issue type
- Display Jira link once escalated

## Phase 2: Claude API Integration

### Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.20.0"
}
```

### Environment Variables
```env
# Claude API Configuration  
ANTHROPIC_API_KEY=your_api_key_here
```

### Implementation

#### 1. Service Layer (`/lib/claude/`)

**`client.ts`** - Claude API client
```typescript
interface ClaudeClient {
  generateBugReport(issue: Issue, customer: Customer): Promise<BugReport>
  analyzePriority(issueContent: string): Promise<PriorityAnalysis>
  estimateEffort(bugReport: string): Promise<EffortEstimate>
}
```

**`templates.ts`** - Bug report template generation
```typescript
interface BugReport {
  summary: string
  description: string
  stepsToReproduce: string[]
  expectedBehavior: string
  actualBehavior: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  suggestedPriority: string
  technicalNotes?: string
}
```

#### 2. Bug Report Template
Claude will generate structured reports with:
- **Technical Summary**: Concise description of the issue
- **Steps to Reproduce**: Clear reproduction steps
- **Expected vs Actual Behavior**: What should happen vs what happens
- **Impact Assessment**: Customer impact and urgency
- **Development Notes**: Technical context and suggestions

#### 3. Enhanced Escalation Workflow
1. Agent clicks "Escalate to Development"
2. Claude analyzes the support issue
3. AI generates structured bug report
4. Agent reviews/edits generated content
5. Select Jira project and issue type
6. Create Jira issue with formatted content
7. Link support issue to Jira issue

## Phase 3: Settings & Configuration

### Implementation
Add Jira configuration section to Settings page:

#### 1. Jira Connection Settings
- Jira URL configuration
- API credentials management (encrypted storage)
- Connection testing

#### 2. Project Mapping
- Map Applications to Jira projects
- Default issue types per application
- Priority mapping between systems

#### 3. Claude Customization
- Custom prompt templates for different issue types
- Organization-specific context for better analysis
- Template customization per application

### Database Schema
```typescript
interface OrganizationSettings {
  // ... existing settings
  jiraIntegration?: {
    enabled: boolean
    baseUrl: string
    defaultProject: string
    projectMapping: Record<string, string>  // applicationId -> jiraProject
  }
  claudeIntegration?: {
    enabled: boolean
    customPrompts: Record<string, string>   // issueType -> prompt
    includeCustomerContext: boolean
  }
}
```

## Implementation Order

### Sprint 1: Basic Jira Integration
1. Create Jira service layer
2. Add escalation UI to issue detail page
3. Implement basic issue creation in Jira
4. Update database schema for Jira links

### Sprint 2: Claude API Integration  
1. Set up Claude API client
2. Implement bug report generation
3. Add review/edit UI for generated reports
4. Integrate with Jira escalation workflow

### Sprint 3: Configuration & Polish
1. Add Jira settings to Settings page
2. Implement project mapping
3. Add Claude prompt customization
4. Error handling and testing

## Benefits
- **Reduced Manual Work**: AI generates structured bug reports
- **Better Communication**: Clear, consistent format for development team
- **Faster Triage**: AI suggests priority and impact assessment
- **Knowledge Capture**: Important context preserved in bug reports
- **Scalable Process**: Consistent quality regardless of support agent experience

## Future Enhancements
- **Pattern Recognition**: Identify recurring issues for proactive fixes
- **Feature Scoping**: AI assistance for feature request analysis
- **Integration Webhooks**: Optional status updates from Jira back to support
- **Analytics**: Track escalation patterns and development outcomes