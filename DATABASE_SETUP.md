# Database Setup Guide

This guide will help you set up PostgreSQL with Drizzle ORM for the Bud budget application.

## Prerequisites

- PostgreSQL installed and running
- Node.js and Yarn installed

## Setup Steps

### 1. Create Database

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE bud_db;
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bud_db"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 3. Generate and Run Migrations

```bash
# Generate migration files (already done)
yarn db:generate

# Push schema to database (for development)
yarn db:push

# Or run migrations (for production)
yarn db:migrate

```

### 4. Database Studio (Optional)

To view and manage your database through a web interface:

```bash
yarn db:studio
```

This will open Drizzle Studio at `http://localhost:4983`

## Database Schema

The application includes the following tables:

- **users**: User accounts and authentication
- **budgetspaces**: User's budget workspaces
- **categories**: Transaction categories within budgetspaces
- **transactions**: Income and expense records
- **budgets**: Budget limits for categories

## API Endpoints

### Budgetspaces

- `GET /api/budgetspaces?userId={id}` - Get all budgetspaces for a user
- `POST /api/budgetspaces` - Create a new budgetspace
- `GET /api/budgetspaces/[id]` - Get a specific budgetspace
- `PUT /api/budgetspaces/[id]` - Update a budgetspace
- `DELETE /api/budgetspaces/[id]` - Delete a budgetspace

## Development Commands

```bash
# Start development server
yarn dev

# Test database connection
yarn db:test

# Generate new migration after schema changes
yarn db:generate

# Push schema changes to database
yarn db:push

# Open database studio
yarn db:studio
```

## Quick Start

1. **Create database**: `CREATE DATABASE bud_db;`
2. **Set environment**: Create `.env.local` with `DATABASE_URL`
3. **Push schema**: `yarn db:push`
4. **Test connection**: `yarn db:test`
5. **Start development**: `yarn dev`

## Notes

- The first budgetspace created for a user is automatically set as default
- All timestamps are automatically managed by the database
- Foreign key constraints ensure data integrity
- UUIDs are used for all primary keys
