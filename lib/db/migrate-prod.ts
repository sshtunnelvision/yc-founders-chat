import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load production environment variables
config({
  path: '.env.production',
});

const SCHEMA_NAME = 'elucide-v2';

const runMigrateProd = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined in production environment');
  }

  console.log('⏳ Running migrations in PRODUCTION environment...');
  console.log('🔄 This will migrate the database at:', process.env.POSTGRES_URL);

  // Confirm before proceeding
  if (process.env.CONFIRM_PROD_MIGRATION !== 'true') {
    console.error('❌ Production migration requires CONFIRM_PROD_MIGRATION=true environment variable');
    console.error('ℹ️ This is a safety measure to prevent accidental production migrations');
    process.exit(1);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  
  const start = Date.now();
  
  try {
    // First ensure schema exists
    await connection`CREATE SCHEMA IF NOT EXISTS ${connection(SCHEMA_NAME)}`;
    console.log('✅ Schema check completed');

    // Drop existing drizzle migrations table from public schema if it exists
    await connection`DROP TABLE IF EXISTS public.__drizzle_migrations`;
    console.log('✅ Cleaned up old migrations table');

    // Set search_path to our schema
    await connection`SET search_path TO ${connection(SCHEMA_NAME)}`;
    console.log('✅ Search path set to schema:', SCHEMA_NAME);

    const db = drizzle(connection, {
      schema: { name: SCHEMA_NAME }
    });
    
    // Run migrations
    await migrate(db, { 
      migrationsFolder: './lib/db/migrations',
      migrationsSchema: SCHEMA_NAME,
    });
    
    const end = Date.now();
    console.log('✅ Production migrations completed in', end - start, 'ms');

    // Verify tables were created
    const tables = await connection`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ${SCHEMA_NAME}
      ORDER BY table_name
    `;
    console.log('📊 Created tables:', tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ Production migration failed', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
  
  process.exit(0);
};

runMigrateProd().catch((err) => {
  console.error('❌ Production migration failed');
  console.error(err);
  process.exit(1);
});