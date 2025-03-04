import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({
  path: '.env.local',
});

async function reset() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined in environment variables');
  }

  const sql = postgres(process.env.POSTGRES_URL, {
    ssl: false,
    connection: {
      application_name: 'elucide-reset'
    },
    types: {
      // eslint-disable-next-line import/no-named-as-default-member
      bigint: postgres.BigInt,
    },
  });

  try {
    console.log('⏳ Dropping all tables...');
    
    // Execute each DROP statement separately
    await sql`DROP TABLE IF EXISTS "Vote" CASCADE`;
    await sql`DROP TABLE IF EXISTS "Message" CASCADE`;
    await sql`DROP TABLE IF EXISTS "Chat" CASCADE`;
    await sql`DROP TABLE IF EXISTS "Suggestion" CASCADE`;
    await sql`DROP TABLE IF EXISTS "Document" CASCADE`;
    await sql`DROP TABLE IF EXISTS "User" CASCADE`;
    
    console.log('✅ Tables dropped successfully');
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      });
    }
  } finally {
    await sql.end();
  }
}

reset().catch(console.error);