import { cosmosClient } from "./client";

let initPromise: Promise<void> | null = null;
let initialized = false;

export async function ensureDatabaseInitialized(): Promise<void> {
  // If already initialized, return immediately
  if (initialized) {
    return Promise.resolve();
  }

  // If initialization is in progress, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = initializeDatabase();
  return initPromise;
}

async function initializeDatabase(): Promise<void> {
  try {
    console.log("Initializing Cosmos DB (one-time setup)...");
    await cosmosClient.initializeDatabase();
    initialized = true;
    console.log("Cosmos DB initialization complete (will not run again)");
  } catch (error) {
    console.error("Cosmos DB initialization failed:", error);
    // Reset the promise so it can be retried, but don't mark as initialized
    initPromise = null;
    throw error;
  }
}
