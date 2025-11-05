# CycleSense Leaderboard

## Overview
CycleSense Leaderboard is a full-stack web application for an offline investment simulation game. It functions as a real-time leaderboard and facilitator console, enabling organizers to manage teams, conduct simulation rounds through various market phases (Green/Blue/Orange/Red), track portfolio allocations, and calculate Net Asset Value (NAV) based on team performance. The simulation involves teams making investment decisions across four asset classes (Equity, Debt, Gold, Cash), receiving pitch and emotion scores, and observing their NAV evolution driven by market returns and strategic choices.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript (SPA)
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **UI Framework**: shadcn/ui built on Radix UI, styled with TailwindCSS
- **Design System**: Inter font, phase-specific color schemes, mobile-first responsive design.
- **Key Pages**: Dashboard, GameSetup, ConfigureTeams, StartRound, TeamInput, RoundSummary.
- **State Management Strategy**: React Query for server state, local `useState` for forms, explicit refetches after mutations.

### Backend Architecture
- **Runtime**: Node.js with Express.js (TypeScript, ES modules)
- **API Pattern**: RESTful JSON API
- **Build Tool**: Vite for frontend, esbuild for backend.
- **Route Structure**: `/api/game-state`, `/api/teams`, `/api/rounds`, `/api/allocations`, `/api/color-cards`, `/api/black-cards`, `/api/game/reset`.
- **Business Logic**: Centralized NAV calculation, portfolio return calculation, allocation validation.
- **Data Storage Strategy**: Hybrid model using PostgreSQL for persistent card data and in-memory for ephemeral game sessions (game state, teams, rounds, allocations). Drizzle ORM for schema definition.

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Core Tables**: `game_state`, `teams`, `color_cards`, `black_cards`, `rounds`, `team_allocations`.
- **Data Types**: Decimal for financial values, text enums for phases, integer scores, UUIDs for primary keys.
- **Migration Strategy**: Drizzle Kit for PostgreSQL migrations, schema defined in `shared/schema.ts`.

### Development vs Production
- **Development**: Vite dev server with HMR, Replit-specific plugins, source maps.
- **Production**: Vite for frontend build (`dist/public`), esbuild for backend (`dist/index.js`).
- **Build Process**: `npm run dev`, `npm run build`, `npm run start`.

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless accessible components.
- **shadcn/ui**: Pre-configured component library based on Radix.
- **Lucide React**: Icon library.

### Styling & Design
- **TailwindCSS**: Utility-first CSS framework.
- **class-variance-authority**: Component variant management.
- **clsx + tailwind-merge**: Conditional className composition.
- **Google Fonts**: Inter, JetBrains Mono.

### Data Fetching & Forms
- **TanStack Query (React Query)**: Server state management.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **@hookform/resolvers**: Zod integration with React Hook Form.

### Database & ORM
- **Drizzle ORM**: Type-safe SQL ORM for PostgreSQL.
- **drizzle-zod**: Schema to Zod validator conversion.
- **@neondatabase/serverless**: PostgreSQL driver for Neon.
- **drizzle-kit**: CLI tool for database migrations.

### Visualization
- **Recharts**: React charting library.

### Routing & Navigation
- **Wouter**: Lightweight React routing library.

### Development Tools
- **Vite**: Frontend build tool.
- **esbuild**: Fast JavaScript/TypeScript bundler.
- **tsx**: TypeScript execution for Node.js.
- **TypeScript**: Static type checking.

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay.
- **@replit/vite-plugin-cartographer**: Code navigation assistance.
- **@replit/vite-plugin-dev-banner**: Development environment indicator.

### Database Integration
- **PostgreSQL via Neon**: For persistent card storage, configured via `DATABASE_URL`.
- **WebSocket Support**: Via `ws` package for Replit.
- **Schema Management**: Drizzle ORM with `npm run db:push`.
- **Sample Data**: Initializes color and black cards on first run.