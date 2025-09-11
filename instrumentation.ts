export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run in Node.js runtime (not Edge runtime)
    const { ensureDatabaseInitialized } = await import("./lib/cosmos/init");

    // Initialize database once when the application starts
    try {
      await ensureDatabaseInitialized();
    } catch (error) {
      console.error("Failed to initialize database on startup:", error);
    }
  }
}
