# Bud - Budget Tracking Application

A modern, full-featured budget tracking and financial analytics platform built with Next.js. Track expenses, manage budgets, and achieve your financial goals with powerful insights and intuitive design.

## Features

- **Budget Spaces**: Create multiple budget workspaces to organize your finances
- **Budget Cycles**: Set up custom budget periods (monthly or custom date ranges) that match your pay schedule
- **Category Management**: Organize transactions with customizable categories, colors, and icons
- **Transaction Tracking**: Record income and expenses with detailed descriptions and dates
- **Budget Limits**: Set spending limits per category and track your progress
- **Onboarding Flow**: Guided setup process for new users
- **Dashboard**: Overview of your financial health at a glance
- **Analytics**: Visual insights into your spending patterns (coming soon)
- **User Authentication**: Secure email/password authentication with Better Auth

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **State Management**: [Jotai](https://jotai.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Component Development**: [Ladle](https://ladle.dev/)

## Getting Started

### Prerequisites

- Node.js 20+ and Yarn
- PostgreSQL installed and running

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd bud
```

2. **Install dependencies**

```bash
yarn install
```

3. **Set up the database**

Create a PostgreSQL database:

```sql
CREATE DATABASE bud_db;
```

4. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bud_db"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `username` and `password` with your PostgreSQL credentials.

5. **Set up the database schema**

```bash
# Push schema to database (for development)
yarn db:push

# Or run migrations (for production)
yarn db:migrate
```

6. **Seed default categories (optional)**

```bash
yarn db:seed:default-categories
```

7. **Start the development server**

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
bud/
├── components/          # React components
│   ├── ui/             # Reusable UI components (Radix UI)
│   ├── budget/         # Budget-related components
│   ├── onboarding/     # Onboarding flow components
│   └── ...
├── db/                 # Database configuration
│   ├── schema.ts       # Drizzle schema definitions
│   ├── db.ts          # Database connection
│   └── auth.ts        # Better Auth configuration
├── src/
│   └── app/           # Next.js App Router pages
│       ├── api/       # API routes
│       ├── dashboard/ # Dashboard page
│       ├── budget/    # Budget management page
│       ├── transactions/ # Transactions page
│       ├── onboarding/ # Onboarding flow
│       └── ...
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and types
├── contexts/          # React contexts
├── scripts/           # Utility scripts
└── drizzle/           # Database migration files
```

## Database Schema

The application uses the following main tables:

- **users**: User accounts and authentication
- **budgetspaces**: User's budget workspaces
- **categories**: Transaction categories within budgetspaces
- **default_categories**: Pre-defined category templates
- **transactions**: Income and expense records
- **budgets**: Budget limits for categories
- **budget_cycles**: Budget period definitions

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.

## API Endpoints

### Authentication

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout

### Budgetspaces

- `GET /api/budgetspaces?userId={id}` - Get all budgetspaces for a user
- `POST /api/budgetspaces` - Create a new budgetspace
- `GET /api/budgetspaces/[id]` - Get a specific budgetspace
- `PUT /api/budgetspaces/[id]` - Update a budgetspace
- `DELETE /api/budgetspaces/[id]` - Delete a budgetspace

### Budget Cycles

- `GET /api/budgetcycles?budgetspaceId={id}` - Get cycles for a budgetspace
- `POST /api/budgetcycles` - Create a new budget cycle
- `GET /api/budgetcycles/[id]` - Get a specific cycle
- `PUT /api/budgetcycles/[id]` - Update a cycle
- `DELETE /api/budgetcycles/[id]` - Delete a cycle

### Budgets

- `GET /api/budgets?budgetspaceId={id}` - Get budgets for a budgetspace
- `POST /api/budgets` - Create a new budget
- `GET /api/budgets/[id]` - Get a specific budget
- `PUT /api/budgets/[id]` - Update a budget
- `DELETE /api/budgets/[id]` - Delete a budget

### Categories

- `GET /api/categories?budgetspaceId={id}` - Get categories for a budgetspace
- `POST /api/categories` - Create a new category
- `GET /api/default-categories` - Get default category templates

### Transactions

- `GET /api/transactions?budgetspaceId={id}` - Get transactions for a budgetspace
- `POST /api/transactions` - Create a new transaction

## Available Scripts

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking
- `yarn db:generate` - Generate database migration files
- `yarn db:migrate` - Run database migrations
- `yarn db:push` - Push schema changes to database (development)
- `yarn db:studio` - Open Drizzle Studio (database GUI)
- `yarn db:seed:default-categories` - Seed default categories
- `yarn ladle:run` - Start Ladle component development server

## Development

### Database Management

For development, you can use `yarn db:push` to quickly sync schema changes. For production, use migrations:

```bash
# After modifying schema.ts
yarn db:generate
yarn db:migrate
```

### Component Development

Use Ladle for isolated component development:

```bash
yarn ladle:run
```

This opens a component development environment at `http://localhost:61000`.

### Code Quality

- TypeScript is used throughout for type safety
- ESLint is configured for code quality
- Prettier (via ESLint) for code formatting

## Future Direction

We're continuously improving Bud with new features and capabilities. Here's what's coming next:

- **Command-Based Transactions**: Add transactions quickly using natural language commands (e.g., "spent $50 on groceries yesterday" or "add income $2000 salary")
- **Goals**: Set and track financial goals with progress monitoring, milestones, and notifications

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)

## License
