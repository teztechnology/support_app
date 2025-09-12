"use server";

import { redirect } from "next/navigation";
import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { createJiraClient } from "./client";
import { JiraCreateIssueRequest } from "./types";
import { ServerActionResponse, Issue, Application } from "@/types";

export async function escalateToJira(
  issueId: string,
  issueTypeId?: string // Optional issue type ID, will auto-detect if not provided
): Promise<ServerActionResponse<{ jiraKey: string; jiraUrl: string }>> {
  try {
    const session = await SessionManager.requirePermission("issues:write");
    const jiraClient = createJiraClient();

    if (!jiraClient) {
      return {
        success: false,
        error:
          "Jira integration is not configured. Please check environment variables.",
      };
    }

    // Get the issue and associated data
    const issue = await dbQueries.getIssueById(issueId, session.organizationId);
    if (!issue) {
      return {
        success: false,
        error: "Issue not found",
      };
    }

    // Check if already escalated
    if (issue.jiraIssueKey) {
      return {
        success: false,
        error: "Issue has already been escalated to Jira",
      };
    }

    // Get application to find Jira project key
    let application: Application | null = null;
    if (issue.applicationId) {
      application = await dbQueries.getApplicationById(
        issue.applicationId,
        session.organizationId
      );
      if (!application?.jiraProjectKey) {
        return {
          success: false,
          error: "Application does not have a Jira project configured",
        };
      }
    }

    if (!application?.jiraProjectKey) {
      return {
        success: false,
        error: "No Jira project key found for this issue",
      };
    }

    // Get customer info
    const customer = await dbQueries.getCustomerById(
      issue.customerId,
      session.organizationId
    );
    const customerName = customer?.companyName || "Unknown Customer";

    // Create structured description for Jira
    const description = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Issue Description" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: issue.description }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Customer Information" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Customer: ", marks: [{ type: "strong" }] },
            { type: "text", text: customerName },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Priority: ", marks: [{ type: "strong" }] },
            { type: "text", text: issue.priority },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Created: ", marks: [{ type: "strong" }] },
            {
              type: "text",
              text: new Date(issue.createdAt).toLocaleDateString(),
            },
          ],
        },
      ],
    };

    // Auto-detect issue type if not provided
    let finalIssueTypeId = issueTypeId;
    if (!finalIssueTypeId) {
      try {
        console.log(
          `Fetching issue types for project: ${application.jiraProjectKey}`
        );
        const availableIssueTypes = await jiraClient.getIssueTypes(
          application.jiraProjectKey
        );
        console.log(`Available issue types:`, availableIssueTypes);

        // Look for Bug first, then Task, then use the first available
        const bugType = availableIssueTypes.find((type) =>
          type.name.toLowerCase().includes("bug")
        );
        const taskType = availableIssueTypes.find((type) =>
          type.name.toLowerCase().includes("task")
        );
        finalIssueTypeId =
          bugType?.id || taskType?.id || availableIssueTypes[0]?.id;

        console.log(`Selected issue type ID: ${finalIssueTypeId}`);

        if (!finalIssueTypeId) {
          return {
            success: false,
            error: `No available issue types found for project ${application.jiraProjectKey}`,
          };
        }
      } catch (error: any) {
        console.error("Failed to get issue types:", error);
        // Fallback to common Bug issue type ID for VALET project
        if (application.jiraProjectKey === "VALET") {
          finalIssueTypeId = "10034"; // Bug issue type for VALET project
          console.log("Using fallback issue type ID for VALET project: 10034");
        } else {
          return {
            success: false,
            error: `Failed to get available issue types for project ${application.jiraProjectKey}: ${error.message}`,
          };
        }
      }
    }

    // Map support priority to Jira priority
    const priorityMapping: Record<string, string> = {
      critical: "1", // Highest
      high: "2", // High
      medium: "3", // Medium
      low: "4", // Low
    };

    // Create Jira issue request
    const jiraRequest: JiraCreateIssueRequest = {
      fields: {
        project: {
          key: application.jiraProjectKey,
        },
        summary: `[SUPPORT] ${issue.title}`,
        description,
        issuetype: {
          id: finalIssueTypeId,
        },
        priority: {
          id: priorityMapping[issue.priority] || "3",
        },
      },
    };

    // Create issue in Jira
    console.log(
      "Creating Jira issue with request:",
      JSON.stringify(jiraRequest, null, 2)
    );
    const jiraResponse = await jiraClient.createIssue(jiraRequest);
    const jiraUrl = jiraClient.getIssueUrl(jiraResponse.key);

    // Update the support issue with Jira information
    const updatedIssue: Partial<Issue> = {
      jiraIssueKey: jiraResponse.key,
      jiraUrl: jiraUrl,
      escalatedAt: new Date().toISOString(),
      escalatedBy: session.userId,
      updatedAt: new Date().toISOString(),
    };

    await dbQueries.updateIssue(issueId, session.organizationId, updatedIssue);

    return {
      success: true,
      data: {
        jiraKey: jiraResponse.key,
        jiraUrl: jiraUrl,
      },
    };
  } catch (error: any) {
    console.error("Error escalating to Jira:", error);
    return {
      success: false,
      error: error.message || "Failed to escalate issue to Jira",
    };
  }
}
