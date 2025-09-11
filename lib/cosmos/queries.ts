import { Container, SqlQuerySpec, FeedOptions } from "@azure/cosmos";
import { cosmosClient } from "./client";
import { generateId } from "@/lib/utils";
import {
  Issue,
  Customer,
  User,
  Organization,
  Category,
  Application,
  Comment,
  FilterParams,
  ActivityItem,
  DashboardStats,
  IssueStatus,
  IssuePriority,
} from "@/types";

export class CosmosDBQueries {
  private async getContainer(containerId: string): Promise<Container> {
    return cosmosClient.getContainer(containerId);
  }

  async createItem<T>(
    containerId: string,
    item: T,
    partitionKey: string
  ): Promise<T> {
    try {
      const container = await this.getContainer(containerId);
      const { resource } = await container.items.create(item as any);
      return resource as T;
    } catch (error) {
      console.error(`Failed to create item in ${containerId}:`, error);
      throw error;
    }
  }

  async updateItem<T>(
    containerId: string,
    id: string,
    item: T,
    partitionKey: string,
    etag?: string
  ): Promise<T> {
    try {
      const container = await this.getContainer(containerId);
      const options: any = { partitionKey };

      if (etag) {
        options.accessCondition = {
          type: "IfMatch",
          condition: etag,
        };
      }

      const { resource } = await container
        .item(id, partitionKey)
        .replace(item as any, options);
      return resource as T;
    } catch (error) {
      console.error(`Failed to update item ${id} in ${containerId}:`, error);
      throw error;
    }
  }

  async getItem<T>(
    containerId: string,
    id: string,
    partitionKey: string
  ): Promise<T | null> {
    try {
      const container = await this.getContainer(containerId);
      const { resource } = await container.item(id, partitionKey).read();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error(`Failed to get item ${id} from ${containerId}:`, error);
      throw error;
    }
  }

  async deleteItem(
    containerId: string,
    id: string,
    partitionKey: string
  ): Promise<void> {
    try {
      const container = await this.getContainer(containerId);
      await container.item(id, partitionKey).delete();
    } catch (error) {
      console.error(`Failed to delete item ${id} from ${containerId}:`, error);
      throw error;
    }
  }

  async queryItems<T>(
    containerId: string,
    querySpec: SqlQuerySpec,
    options?: FeedOptions
  ): Promise<T[]> {
    try {
      const container = await this.getContainer(containerId);
      const { resources } = await container.items
        .query<T>(querySpec, options)
        .fetchAll();
      return resources;
    } catch (error) {
      console.error(`Failed to query items from ${containerId}:`, error);
      throw error;
    }
  }

  async getIssues(
    organizationId: string,
    filters: FilterParams = {}
  ): Promise<Issue[]> {
    let query = `SELECT * FROM c WHERE c.organizationId = @organizationId`;
    const parameters: any[] = [
      { name: "@organizationId", value: organizationId },
    ];

    if (filters.status?.length) {
      query += ` AND c.status IN (${filters.status.map((_, i) => `@status${i}`).join(", ")})`;
      filters.status.forEach((status, i) => {
        parameters.push({ name: `@status${i}`, value: status });
      });
    }

    if (filters.priority?.length) {
      query += ` AND c.priority IN (${filters.priority.map((_, i) => `@priority${i}`).join(", ")})`;
      filters.priority.forEach((priority, i) => {
        parameters.push({ name: `@priority${i}`, value: priority });
      });
    }

    if (filters.assignedToId) {
      query += ` AND c.assignedToId = @assignedToId`;
      parameters.push({ name: "@assignedToId", value: filters.assignedToId });
    }

    if (filters.customerId) {
      query += ` AND c.customerId = @customerId`;
      parameters.push({ name: "@customerId", value: filters.customerId });
    }

    if (filters.category) {
      query += ` AND c.category = @category`;
      parameters.push({ name: "@category", value: filters.category });
    }

    if (filters.search) {
      query += ` AND (CONTAINS(LOWER(c.title), LOWER(@search)) OR CONTAINS(LOWER(c.description), LOWER(@search)))`;
      parameters.push({ name: "@search", value: filters.search });
    }

    if (filters.dateRange) {
      query += ` AND c.createdAt >= @startDate AND c.createdAt <= @endDate`;
      parameters.push({ name: "@startDate", value: filters.dateRange.start });
      parameters.push({ name: "@endDate", value: filters.dateRange.end });
    }

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";
    query += ` ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;

    const querySpec: SqlQuerySpec = {
      query,
      parameters,
    };

    return this.queryItems<Issue>("issues", querySpec);
  }

  async getIssueById(
    id: string,
    organizationId: string
  ): Promise<Issue | null> {
    return this.getItem<Issue>("issues", id, organizationId);
  }

  async createIssue(
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt">
  ): Promise<Issue> {
    const newIssue: Issue = {
      ...issue,
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.createItem<Issue>("issues", newIssue, issue.organizationId);
  }

  async updateIssue(
    id: string,
    organizationId: string,
    updates: Partial<Issue>,
    etag?: string
  ): Promise<Issue> {
    const existingIssue = await this.getIssueById(id, organizationId);
    if (!existingIssue) {
      throw new Error("Issue not found");
    }

    const updatedIssue: Issue = {
      ...existingIssue,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.updateItem<Issue>(
      "issues",
      id,
      updatedIssue,
      organizationId,
      etag
    );
  }

  async getCustomers(organizationId: string): Promise<Customer[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.organizationId = @organizationId ORDER BY c.name ASC",
      parameters: [{ name: "@organizationId", value: organizationId }],
    };

    return this.queryItems<Customer>("customers", querySpec);
  }

  async getCustomerById(
    id: string,
    organizationId: string
  ): Promise<Customer | null> {
    return this.getItem<Customer>("customers", id, organizationId);
  }

  async createCustomer(
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "totalIssues">
  ): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalIssues: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.createItem<Customer>(
      "customers",
      newCustomer,
      customer.organizationId
    );
  }

  async getUsers(organizationId: string): Promise<User[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.isActive = true ORDER BY c.name ASC",
      parameters: [{ name: "@organizationId", value: organizationId }],
    };

    return this.queryItems<User>("users", querySpec);
  }

  async getUserById(id: string, organizationId: string): Promise<User | null> {
    return this.getItem<User>("users", id, organizationId);
  }

  async getUserByStytchMemberId(stytchMemberId: string): Promise<User | null> {
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.stytchMemberId = @stytchMemberId",
      parameters: [{ name: "@stytchMemberId", value: stytchMemberId }],
    };

    const users = await this.queryItems<User>("users", querySpec);
    return users.length > 0 ? users[0] : null;
  }

  async getOrganizationByStytchId(
    stytchOrganizationId: string
  ): Promise<Organization | null> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.stytchOrganizationId = @stytchOrganizationId",
      parameters: [
        { name: "@stytchOrganizationId", value: stytchOrganizationId },
      ],
    };

    const orgs = await this.queryItems<Organization>(
      "organizations",
      querySpec
    );
    return orgs.length > 0 ? orgs[0] : null;
  }

  async getCategories(organizationId: string): Promise<Category[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.isActive = true ORDER BY c.name ASC",
      parameters: [{ name: "@organizationId", value: organizationId }],
    };

    return this.queryItems<Category>("categories", querySpec);
  }

  async getCategoriesByApplication(
    organizationId: string,
    applicationId: string
  ): Promise<Category[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.applicationId = @applicationId AND c.isActive = true ORDER BY c.name ASC",
      parameters: [
        { name: "@organizationId", value: organizationId },
        { name: "@applicationId", value: applicationId },
      ],
    };
    return this.queryItems<Category>("categories", querySpec);
  }

  async createCategory(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: generateId("category"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.createItem<Category>(
      "categories",
      newCategory,
      category.organizationId
    );
  }

  async updateCategory(
    id: string,
    organizationId: string,
    updates: Partial<Category>
  ): Promise<Category> {
    const existingCategory = await this.getItem<Category>(
      "categories",
      id,
      organizationId
    );
    if (!existingCategory) {
      throw new Error("Category not found");
    }

    const updatedCategory = {
      ...existingCategory,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.updateItem<Category>(
      "categories",
      id,
      updatedCategory,
      organizationId
    );
  }

  async deleteCategory(id: string, organizationId: string): Promise<void> {
    await this.deleteItem("categories", id, organizationId);
  }

  async getApplications(organizationId: string): Promise<Application[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.organizationId = @organizationId AND c.isActive = true ORDER BY c.name ASC",
      parameters: [{ name: "@organizationId", value: organizationId }],
    };

    return this.queryItems<Application>("applications", querySpec);
  }

  async createApplication(
    application: Omit<Application, "id" | "createdAt" | "updatedAt">
  ): Promise<Application> {
    const newApplication: Application = {
      ...application,
      id: generateId("application"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.createItem<Application>(
      "applications",
      newApplication,
      application.organizationId
    );
  }

  async updateApplication(
    id: string,
    organizationId: string,
    updates: Partial<Application>
  ): Promise<Application> {
    const existingApplication = await this.getItem<Application>(
      "applications",
      id,
      organizationId
    );
    if (!existingApplication) {
      throw new Error("Application not found");
    }

    const updatedApplication = {
      ...existingApplication,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.updateItem<Application>(
      "applications",
      id,
      updatedApplication,
      organizationId
    );
  }

  async deleteApplication(id: string, organizationId: string): Promise<void> {
    await this.deleteItem("applications", id, organizationId);
  }

  async getComments(
    issueId: string,
    organizationId: string
  ): Promise<Comment[]> {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM c WHERE c.issueId = @issueId ORDER BY c.createdAt ASC",
      parameters: [{ name: "@issueId", value: issueId }],
    };

    return this.queryItems<Comment>("comments", querySpec);
  }

  async addComment(
    comment: Omit<Comment, "id" | "createdAt" | "organizationId"> & {
      organizationId: string;
    }
  ): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    return this.createItem<Comment>(
      "comments",
      newComment,
      comment.organizationId
    );
  }

  async deleteComment(
    commentId: string,
    organizationId: string
  ): Promise<void> {
    await this.deleteItem("comments", commentId, organizationId);
  }

  async getDashboardStats(
    organizationId: string,
    dateRange?: { start: string; end: string }
  ): Promise<DashboardStats> {
    let issueQuery = "SELECT * FROM c WHERE c.organizationId = @organizationId";
    const parameters = [{ name: "@organizationId", value: organizationId }];

    if (dateRange) {
      issueQuery +=
        " AND c.createdAt >= @startDate AND c.createdAt <= @endDate";
      parameters.push({ name: "@startDate", value: dateRange.start });
      parameters.push({ name: "@endDate", value: dateRange.end });
    }

    const querySpec: SqlQuerySpec = { query: issueQuery, parameters };
    const issues = await this.queryItems<Issue>("issues", querySpec);

    const totalIssues = issues.length;
    const openIssues = issues.filter(
      (i) => !["resolved", "closed"].includes(i.status)
    ).length;
    const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
    const criticalIssues = issues.filter(
      (i) => i.priority === "critical"
    ).length;

    const issuesByStatus: Record<IssueStatus, number> = {
      new: issues.filter((i) => i.status === "new").length,
      in_progress: issues.filter((i) => i.status === "in_progress").length,
      awaiting_customer: issues.filter((i) => i.status === "awaiting_customer")
        .length,
      resolved: issues.filter((i) => i.status === "resolved").length,
    };

    const issuesByPriority: Record<IssuePriority, number> = {
      critical: issues.filter((i) => i.priority === "critical").length,
      high: issues.filter((i) => i.priority === "high").length,
      medium: issues.filter((i) => i.priority === "medium").length,
      low: issues.filter((i) => i.priority === "low").length,
    };

    const resolvedWithTime = issues.filter((i) => i.resolvedAt && i.createdAt);
    const averageResolutionTime =
      resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, issue) => {
            const created = new Date(issue.createdAt).getTime();
            const resolved = new Date(issue.resolvedAt!).getTime();
            return acc + (resolved - created);
          }, 0) /
          resolvedWithTime.length /
          (1000 * 60 * 60)
        : 0;

    const activityQuery: SqlQuerySpec = {
      query:
        "SELECT TOP 10 * FROM c WHERE c.organizationId = @organizationId ORDER BY c.timestamp DESC",
      parameters: [{ name: "@organizationId", value: organizationId }],
    };
    const recentActivity = await this.queryItems<ActivityItem>(
      "activities",
      activityQuery
    );

    return {
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues,
      averageResolutionTime,
      issuesByStatus,
      issuesByPriority,
      trendsData: [],
      recentActivity,
    };
  }
}

export const dbQueries = new CosmosDBQueries();
