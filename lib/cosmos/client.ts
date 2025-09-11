import { CosmosClient, Database, Container } from "@azure/cosmos";
import { CosmosDbConfig } from "@/types";

class CosmosDBClient {
  private static instance: CosmosDBClient;
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private containers: Map<string, Container> = new Map();

  private constructor() {
    // Delay initialization until first use
  }

  private initialize() {
    if (this.client) return; // Already initialized

    const config: CosmosDbConfig = {
      endpoint: process.env.AZURE_COSMOS_ENDPOINT!,
      key: process.env.AZURE_COSMOS_KEY!,
      databaseId: process.env.AZURE_COSMOS_DATABASE_ID!,
    };

    if (!config.endpoint || !config.key || !config.databaseId) {
      throw new Error("Missing required Cosmos DB configuration");
    }

    this.client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
    });

    this.database = this.client.database(config.databaseId);
  }

  public static getInstance(): CosmosDBClient {
    if (!CosmosDBClient.instance) {
      CosmosDBClient.instance = new CosmosDBClient();
    }
    return CosmosDBClient.instance;
  }

  public async getContainer(containerId: string): Promise<Container> {
    this.initialize();

    if (this.containers.has(containerId)) {
      return this.containers.get(containerId)!;
    }

    try {
      const { container } = await this.database!.containers.createIfNotExists({
        id: containerId,
        partitionKey: {
          paths: ["/organizationId"],
        },
        indexingPolicy: {
          indexingMode: "consistent",
          includedPaths: [{ path: "/*" }],
          excludedPaths: [{ path: "/attachments/*" }, { path: "/metadata/*" }],
        },
      });

      this.containers.set(containerId, container);
      return container;
    } catch (error) {
      console.error(`Failed to create/get container ${containerId}:`, error);
      throw error;
    }
  }

  public async initializeDatabase(): Promise<void> {
    this.initialize();

    try {
      // First, ensure the database exists
      await this.client!.databases.createIfNotExists({
        id: process.env.AZURE_COSMOS_DATABASE_ID!,
      });
      console.log(`Database '${process.env.AZURE_COSMOS_DATABASE_ID}' ready`);

      const containers = [
        "organizations",
        "users",
        "customers",
        "issues",
        "comments",
        "categories",
        "activities",
      ];

      // Create all containers in parallel
      await Promise.all(
        containers.map((containerId) => this.getContainer(containerId))
      );

      console.log("Database and containers initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  public getClient(): CosmosClient {
    this.initialize();
    return this.client!;
  }

  public getDatabase(): Database {
    this.initialize();
    return this.database!;
  }
}

export const cosmosClient = CosmosDBClient.getInstance();
