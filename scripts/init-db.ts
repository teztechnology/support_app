#!/usr/bin/env tsx

// Load environment variables FIRST
import { config } from 'dotenv'
import { join } from 'path'

// Load .env.local file before any other imports
config({ path: join(__dirname, '../.env.local') })

// Now import after env vars are loaded
import { cosmosClient } from '../lib/cosmos/client'

async function main() {
  try {
    console.log('🚀 Starting Cosmos DB initialization...')
    console.log(`📍 Endpoint: ${process.env.AZURE_COSMOS_ENDPOINT}`)
    console.log(`🔑 Key: ${process.env.AZURE_COSMOS_KEY ? '[PRESENT]' : '[MISSING]'}`)
    console.log(`📦 Database: ${process.env.AZURE_COSMOS_DATABASE_ID}`)
    
    await cosmosClient.initializeDatabase()
    
    console.log('✅ Database initialization completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

main()