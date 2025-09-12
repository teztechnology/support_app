import Anthropic from "@anthropic-ai/sdk";
import { Issue, Customer } from "@/types";

export interface BugReport {
  summary: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  impact: "low" | "medium" | "high" | "critical";
  technicalNotes?: string;
}

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  async generateBugReport(
    issue: Issue,
    customer: Customer | null
  ): Promise<BugReport> {
    const customerInfo = customer
      ? `Customer: ${customer.companyName}`
      : "Customer: Unknown";

    const prompt = `You are a technical support expert analyzing a support issue to create a structured bug report for developers. 

Based on the following support issue information, generate a detailed bug report:

Issue Title: ${issue.title}
Issue Description: ${issue.description}
Priority: ${issue.priority}
${customerInfo}
Created: ${new Date(issue.createdAt).toLocaleDateString()}

Please analyze this information and create a structured bug report with the following sections:

1. **Summary**: A concise technical summary suitable for developers (1-2 sentences)
2. **Description**: A detailed technical description of the issue
3. **Steps to Reproduce**: Clear, numbered steps to reproduce the issue
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Impact**: Assess the impact level (low/medium/high/critical)
7. **Technical Notes**: Any additional technical context or suggestions

Format your response as a JSON object with the following structure:
{
  "summary": "Brief technical summary",
  "description": "Detailed technical description",
  "stepsToReproduce": ["Step 1", "Step 2", "Step 3"],
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens", 
  "impact": "low|medium|high|critical",
  "technicalNotes": "Additional technical context (optional)"
}

Focus on being precise, technical, and actionable for developers. If information is missing, make reasonable assumptions based on the context provided.`;

    try {
      const response = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
      }

      // Parse the JSON response
      const bugReportText = content.text.trim();

      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = bugReportText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Claude response");
      }

      const bugReport = JSON.parse(jsonMatch[0]) as BugReport;

      // Validate the response has required fields
      if (!bugReport.summary || !bugReport.description || !bugReport.impact) {
        throw new Error("Invalid bug report structure from Claude API");
      }

      return bugReport;
    } catch (error: any) {
      console.error("Claude API Error:", error);

      // Return a fallback bug report if API fails
      const fallbackReport: BugReport = {
        summary: `[SUPPORT] ${issue.title}`,
        description: issue.description,
        stepsToReproduce: [
          "Steps to reproduce are not available from the support issue",
        ],
        expectedBehavior: "Application should function as expected",
        actualBehavior:
          "User is experiencing issues as described in the support ticket",
        impact: this.mapPriorityToImpact(issue.priority),
        technicalNotes: `Original support issue from ${customerInfo}. Priority: ${issue.priority}. Created: ${new Date(issue.createdAt).toLocaleDateString()}`,
      };

      return fallbackReport;
    }
  }

  private mapPriorityToImpact(priority: string): BugReport["impact"] {
    switch (priority.toLowerCase()) {
      case "critical":
        return "critical";
      case "high":
        return "high";
      case "medium":
        return "medium";
      case "low":
      default:
        return "low";
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test request to verify API connectivity
      const response = await this.client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

      return response.content.length > 0;
    } catch (error) {
      console.error("Claude API connection test failed:", error);
      return false;
    }
  }
}

export function createClaudeClient(): ClaudeClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn(
      "Claude integration not configured. Missing ANTHROPIC_API_KEY"
    );
    return null;
  }

  return new ClaudeClient(apiKey);
}
