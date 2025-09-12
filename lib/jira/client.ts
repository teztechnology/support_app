import axios, { AxiosInstance } from "axios";
import {
  JiraConfig,
  JiraCreateIssueRequest,
  JiraResponse,
  JiraProject,
  JiraIssueType,
  JiraPriority,
} from "./types";

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  async createIssue(request: JiraCreateIssueRequest): Promise<JiraResponse> {
    try {
      const response = await this.client.post("/issue", request);
      return {
        key: response.data.key,
        id: response.data.id,
        self: response.data.self,
      };
    } catch (error: any) {
      console.error("Jira API Error:", error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.errorMessages?.join(", ") ||
        error.response?.data?.errors ||
        error.message ||
        "Unknown error";

      throw new Error(`Failed to create Jira issue: ${errorMessage}`);
    }
  }

  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.client.get("/project");
      return response.data.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        issueTypes: project.issueTypes || [],
      }));
    } catch (error: any) {
      console.error("Jira API Error:", error.response?.data || error.message);
      throw new Error(`Failed to fetch Jira projects: ${error.message}`);
    }
  }

  async getIssueTypes(projectKey: string): Promise<JiraIssueType[]> {
    try {
      const response = await this.client.get(
        `/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`
      );

      if (!response.data.projects || response.data.projects.length === 0) {
        throw new Error(
          `Project ${projectKey} not found or you don't have access to it`
        );
      }

      const project = response.data.projects[0];
      if (!project.issuetypes || project.issuetypes.length === 0) {
        throw new Error(`No issue types available for project ${projectKey}`);
      }

      return project.issuetypes.map((issueType: any) => ({
        id: issueType.id,
        name: issueType.name,
        description: issueType.description,
        iconUrl: issueType.iconUrl,
        subtask: issueType.subtask || false,
      }));
    } catch (error: any) {
      console.error("Jira API Error:", error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.errorMessages?.join(", ") ||
        error.response?.data?.errors ||
        error.message ||
        "Unknown error";

      throw new Error(
        `Failed to fetch issue types for project ${projectKey}: ${errorMessage}`
      );
    }
  }

  async getPriorities(): Promise<JiraPriority[]> {
    try {
      const response = await this.client.get("/priority");
      return response.data.map((priority: any) => ({
        id: priority.id,
        name: priority.name,
        iconUrl: priority.iconUrl,
      }));
    } catch (error: any) {
      console.error("Jira API Error:", error.response?.data || error.message);
      throw new Error(`Failed to fetch Jira priorities: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/myself");
      return true;
    } catch (error) {
      return false;
    }
  }

  async diagnosePermissions(projectKey: string): Promise<{
    canConnect: boolean;
    userInfo?: any;
    hasProjectAccess: boolean;
    availableProjects?: string[];
    canCreateIssues: boolean;
    availableIssueTypes?: any[];
    error?: string;
  }> {
    const diagnosis: {
      canConnect: boolean;
      userInfo?: any;
      hasProjectAccess: boolean;
      availableProjects?: string[];
      canCreateIssues: boolean;
      availableIssueTypes?: any[];
      error?: string;
    } = {
      canConnect: false,
      hasProjectAccess: false,
      canCreateIssues: false,
    };

    try {
      // Test 1: Basic connection and user info
      const userResponse = await this.client.get("/myself");
      diagnosis.canConnect = true;
      diagnosis.userInfo = {
        accountId: userResponse.data.accountId,
        displayName: userResponse.data.displayName,
        emailAddress: userResponse.data.emailAddress,
      };

      // Test 2: Get available projects
      try {
        const projectsResponse = await this.client.get("/project");
        diagnosis.availableProjects = projectsResponse.data.map(
          (p: any) => `${p.key}: ${p.name}`
        );

        const hasProject = projectsResponse.data.some(
          (p: any) => p.key === projectKey
        );
        diagnosis.hasProjectAccess = hasProject;
      } catch (error) {
        diagnosis.error = "Cannot access projects list";
      }

      // Test 3: Test issue creation permissions for this project
      if (diagnosis.hasProjectAccess) {
        try {
          const createMetaResponse = await this.client.get(
            `/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`
          );
          const project = createMetaResponse.data.projects[0];

          if (project && project.issueTypes.length > 0) {
            diagnosis.canCreateIssues = true;
            diagnosis.availableIssueTypes = project.issueTypes.map(
              (it: any) => ({
                id: it.id,
                name: it.name,
                description: it.description,
              })
            );
          }
        } catch (error) {
          diagnosis.error = `Cannot access create metadata for project ${projectKey}`;
        }
      }

      return diagnosis;
    } catch (error: any) {
      return {
        ...diagnosis,
        error: error.response?.data?.errorMessages?.join(", ") || error.message,
      };
    }
  }

  getIssueUrl(issueKey: string): string {
    return `${this.config.baseUrl}/browse/${issueKey}`;
  }
}

export function createJiraClient(): JiraClient | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  console.log("Jira Client Configuration Check:");
  console.log(
    "- Base URL:",
    baseUrl ? `${baseUrl.substring(0, 20)}...` : "MISSING"
  );
  console.log("- Email:", email ? `${email.substring(0, 5)}...` : "MISSING");
  console.log(
    "- API Token:",
    apiToken ? `${apiToken.substring(0, 8)}...` : "MISSING"
  );

  if (!baseUrl || !email || !apiToken) {
    console.warn(
      "Jira configuration incomplete. Missing JIRA_BASE_URL, JIRA_EMAIL, or JIRA_API_TOKEN"
    );
    return null;
  }

  return new JiraClient({
    baseUrl,
    email,
    apiToken,
  });
}
