# CycleSense Leaderboard

## Overview

CycleSense Leaderboard is a full-stack web application designed for facilitating an offline investment simulation game. The application serves as a real-time leaderboard and facilitator console, enabling game organizers to manage teams, run simulation rounds through different market phases (Green/Blue/Orange/Red), track portfolio allocations, and calculate NAV (Net Asset Value) scores based on team performance.

The simulation progresses through color-coded market phases where teams make investment decisions across four asset classes (Equity, Debt, Gold, Cash), receive pitch and emotion scoring, and see their NAV evolve based on market returns and strategic choices. The facilitator controls the game flow, inputs team decisions, and reveals results through a structured round-by-round process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript in SPA (Single Page Application) mode
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state and API data caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom design system following Material Design principles

**Design System**:
- Typography: Inter font family (primary), JetBrains Mono (numerical data)
- Color scheme: Neutral base with phase-specific colors (Green/Blue/Orange/Red for market phases)
- Component library: Pre-built shadcn/ui components with customized variants
- Responsive layout: Mobile-first approach with Tailwind breakpoints

**Key Pages**:
- Dashboard: Main leaderboard view with NAV standings and round history
- GameSetup: Initialize new game with team configuration and starting allocations
- ConfigureTeams: Add/edit/delete teams and manage team settings
- StartRound: Facilitator console for selecting market phase and drawing cards
- TeamInput: Per-team input form for allocations, pitch/emotion scores
- RoundSummary: Display round results with NAV calculations before/after

**State Management Strategy**:
- Server state cached via React Query with manual refetch triggers
- Optimistic updates disabled in favor of explicit refetches after mutations
- No complex client-side state; forms use local useState
- Infinite stale time to prevent unnecessary refetches

### Backend Architecture

**Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Build Tool**: Vite for frontend, esbuild for backend bundling
- **API Pattern**: RESTful JSON API with conventional HTTP methods

**Route Structure**:
- `/api/game-state` - Game configuration and current state management
- `/api/teams` - CRUD operations for teams
- `/api/rounds` - Round creation and retrieval
- `/api/allocations` - Team allocation data per round
- `/api/color-cards` - Market phase card data
- `/api/black-cards` - Special event cards
- `/api/game/reset` - Full game reset endpoint

**Business Logic**:
- NAV calculation formula centralized in server logic
- Portfolio return calculation based on asset allocation percentages and card returns
- Validation: Allocation percentages must sum to 100%, pitch/emotion scores 0-5 range
- Round progression: Linear sequence tracking via currentRound counter

**Data Storage Strategy**:
- Abstract storage interface (`IStorage`) allowing swappable implementations
- Currently uses in-memory storage (data resets on server restart)
- Schema defined with Drizzle ORM for future PostgreSQL migration
- UUID-based primary keys for all entities

### Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect (prepared for database provisioning)

**Core Tables**:
- `game_state`: Singleton table tracking game mode (virtual/in-person), current round number, active status
- `teams`: Team information with name, current NAV, cumulative pitch/emotion totals
- `color_cards`: Market phase cards with asset class return percentages (equity/debt/gold/cash)
- `black_cards`: Special event cards with modifier values for asset classes
- `rounds`: Round records linking to color cards, black cards, and round metadata
- `team_allocations`: Per-team data for each round including allocations, scores, emotion tokens

**Data Types**:
- Decimal precision for financial values (NAV, returns, percentages)
- Text enums for phases (green/blue/orange/red) and emotion tokens
- Integer scores for pitch/emotion points (0-5 range)
- Boolean flags for game state (isActive)

**Migration Strategy**:
- Schema defined in `shared/schema.ts` for type-safe sharing between frontend/backend
- Drizzle Kit configured for PostgreSQL migrations in `drizzle.config.ts`
- Migration output directory: `./migrations`
- Database provisioning pending (DATABASE_URL environment variable required)

### Development vs Production

**Development Mode**:
- Vite dev server with HMR (Hot Module Replacement)
- Runtime error overlay for debugging
- Replit-specific plugins: cartographer (code map), dev banner
- Source maps enabled via @jridgewell/trace-mapping

**Production Build**:
- Frontend: Vite build outputs to `dist/public`
- Backend: esbuild bundles server to `dist/index.js` with ESM format
- Static file serving from compiled frontend
- Environment-based configuration via NODE_ENV

**Build Process**:
- `npm run dev`: Runs development server with tsx for TypeScript execution
- `npm run build`: Compiles both frontend (Vite) and backend (esbuild)
- `npm run start`: Runs production server from bundled output

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless accessible component primitives (dialog, dropdown, select, accordion, etc.)
- **shadcn/ui**: Pre-configured component library built on Radix with Tailwind styling
- **Lucide React**: Icon library for UI elements

### Styling & Design
- **TailwindCSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Component variant management
- **clsx + tailwind-merge**: Conditional className composition
- **Google Fonts**: Inter (primary font), JetBrains Mono (monospace for numbers)

### Data Fetching & Forms
- **TanStack Query (React Query)**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for API requests/responses
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Database & ORM
- **Drizzle ORM**: Type-safe SQL ORM for PostgreSQL
- **drizzle-zod**: Schema to Zod validator conversion
- **@neondatabase/serverless**: PostgreSQL driver for Neon (serverless Postgres)
- **drizzle-kit**: CLI tool for database migrations

### Visualization
- **Recharts**: React charting library for NAV history line charts

### Routing & Navigation
- **Wouter**: Lightweight React routing library (alternative to React Router)

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Fast JavaScript/TypeScript bundler for backend
- **tsx**: TypeScript execution engine for Node.js
- **TypeScript**: Static type checking

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation assistance
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Future Database Integration
The application is architected to use PostgreSQL via Neon serverless database, but currently operates with in-memory storage. The database connection will be established via the `DATABASE_URL` environment variable once provisioned. All schema definitions are ready for migration using Drizzle Kit.

## Recent Changes

### November 4, 2025 - Virtual Mode Workflow & Critical Bug Fixes

**Virtual Mode Workflow Refactored:**
- Separated dice roll from card draw into distinct steps
- Asset returns now hidden until AFTER NAV calculation completes
- Automatic NAV calculation using existing team allocations (no allocation changes in Virtual mode)
- Returns revealed only after calculation to prevent premature viewing
- Black card reveal prompt appears after returns shown
- Black card application triggers NAV recalculation with proper baseline values

**Critical Bug Fixes:**
1. **Duplicate Allocation Prevention**: Added `hasCalculatedRef` guard in RoundSummary useEffect to prevent double execution of auto-calculation mutation when teams query resolves after allocations query
2. **Team NAV Rollback**: Modified `deleteAllocationsForRound` storage method to rollback team `currentNav`, `pitchTotal`, and `emotionTotal` to pre-round state before deleting allocations, ensuring black card recalculation starts from correct baseline
3. **Black Card Recalculation**: Fixed black card application to properly delete existing allocations, rollback team state, and recalculate NAV from baseline values (prevents NAV compounding)
4. **Dashboard Sorting**: Fixed round sorting to use `roundNumber` (integer) instead of `roundId` (UUID) for correct chronological ordering in round history and NAV progression chart
5. **useEffect Crash Fix**: Moved `roundAllocations` declaration before useEffect to prevent "Cannot access before initialization" runtime error

**New API Endpoints:**
- `DELETE /api/allocations/round/:roundId` - Deletes all allocations for a round AND rolls back affected team NAV totals to pre-round state

**Architecture Improvements:**
- Separate pages for Virtual (RoundSummary) and In-Person (TeamInput) mode workflows
- Server-side NAV calculation prevents client manipulation
- Proper state management with rollback support for recalculation scenarios
- Data integrity maintained through transactional-style allocation deletion with state restoration

**Testing:**
- End-to-end tests verified for both Virtual and In-Person modes
- Virtual mode: Dice roll → Card draw (hidden) → Auto NAV calc → Reveal → Black card → Recalc
- In-Person mode: Manual phase → Card draw (shown) → Manual allocations → Individual NAV calc