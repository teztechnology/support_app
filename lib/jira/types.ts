export interface JiraIssue {
  summary: string;
  description: string;
  issueType: string;
  priority: string;
  reporter?: string;
  project: string;
}

export interface JiraResponse {
  key: string; // e.g., "PROJ-123"
  id: string;
  self: string; // URL to issue
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  issueTypes: JiraIssueType[];
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
}

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraCreateIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description: {
      type: string;
      version: number;
      content: any[];
    };
    issuetype: {
      id: string;
    };
    priority?: {
      id: string;
    };
    reporter?: {
      accountId: string;
    };
  };
}
