import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const SCHEMA_NAME = 'elucide-v2';

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  
  console.log('⏳ Running migrations...');
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
    console.log('✅ Migrations completed in', end - start, 'ms');

    // Verify tables were created
    const tables = await connection`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ${SCHEMA_NAME}
      ORDER BY table_name
    `;
    console.log('📊 Created tables:', tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ Migration failed', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
  
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
