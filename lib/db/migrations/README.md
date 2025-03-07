# Database Migrations Guide

This guide explains how to work with database migrations using Drizzle ORM.

## Prerequisites

- Node.js and pnpm installed
- Access to both local and production PostgreSQL databases
- Environment variables properly configured in `.env` and `.env.production`

## Steps to Create and Run Migrations

### 1. Create Schema Changes

First, make your schema changes in the Drizzle schema files (typically in `lib/db/schema.ts`).

### 2. Generate Migration Files

To create a new migration:

```bash
pnpm drizzle-kit generate:pg
```

This will:

- Create a new timestamped .sql file in `lib/db/migrations/`
- Update `migrations/meta/_journal.json` with migration metadata

### 3. Review Migration Files

- Check the generated .sql file in `lib/db/migrations/`
- Verify the SQL statements match your intended schema changes
- All tables should be in the "elucide-v2" schema

### 4. Run Migrations Locally

To apply migrations to your local database:

```bash
pnpm db:migrate
```

This command will:

- Create the schema if it doesn't exist
- Clean up any old migration tables
- Apply all pending migrations
- Update the migrations journal

### 5. Run Migrations in Production

Before running production migrations:

1. Set the `CONFIRM_PROD_MIGRATION` environment variable:

```bash
export CONFIRM_PROD_MIGRATION=true
```

2. Run the production migration:

```bash
pnpm db:migrate:prod
```

## Important Notes

- Always backup your production database before running migrations
- All tables are created in the "elucide-v2" schema
- Migration files are tracked in version control
- The `__drizzle_migrations` table keeps track of applied migrations

## Troubleshooting

If migrations fail:

1. Check the error messages in the console
2. Verify your database connection strings
3. Ensure you have proper permissions
4. For production, make sure `CONFIRM_PROD_MIGRATION=true` is set

## Schema Structure

Current schema includes the following tables (all in "elucide-v2" schema):

- Chat
- Document
- Message
- Suggestion
- User
- Vote
