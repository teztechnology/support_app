"use server";

import { createJiraClient } from "./client";

export async function diagnoseJiraSetup(projectKey: string) {
  const jiraClient = createJiraClient();

  if (!jiraClient) {
    return {
      success: false,
      error: "Jira client not configured. Missing environment variables.",
      missing: [],
    };
  }

  const diagnosis = await jiraClient.diagnosePermissions(projectKey);

  return {
    success: true,
    diagnosis,
  };
}

export async function listJiraProjects() {
  const jiraClient = createJiraClient();

  if (!jiraClient) {
    return {
      success: false,
      error: "Jira client not configured. Missing environment variables.",
    };
  }

  try {
    const projects = await jiraClient.getProjects();
    return {
      success: true,
      projects: projects.map((p) => ({
        key: p.key,
        name: p.name,
        description: p.description,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
