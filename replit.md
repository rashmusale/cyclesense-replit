# CycleSense Leaderboard

## Overview
CycleSense Leaderboard is a full-stack web application for an offline investment simulation game. It functions as a real-time leaderboard and facilitator console, enabling organizers to manage teams, conduct simulation rounds through various market phases (Green/Blue/Orange/Red), track portfolio allocations, and calculate Net Asset Value (NAV) based on team performance. The simulation involves teams making investment decisions across four asset classes (Equity, Debt, Gold, Cash), receiving pitch and emotion scores, and observing their NAV evolution driven by market returns and strategic choices.

## User Preferences
Preferred communication style: Simple, everyday language.

## NAV Calculation Formula

### After Color Card
```
Weighted Return = (Equity% ÷ 100) × Equity Return 
                + (Debt% ÷ 100) × Debt Return
                + (Gold% ÷ 100) × Gold Return
                + (Cash% ÷ 100) × Cash Return

NAV After Color Card = NAV Before × (1 + Weighted Return ÷ 100) + Emotion Score + Pitch Score
```

### After Black Card (if applied)
```
Total Modifier = (Equity% ÷ 100) × Equity Modifier
               + (Debt% ÷ 100) × Debt Modifier
               + (Gold% ÷ 100) × Gold Modifier
               + (Cash% ÷ 100) × Cash Modifier

Final NAV = NAV After Color Card × (1 + Total Modifier ÷ 100)
```

**Note:** Black card modifiers apply multiplicatively to the NAV after color card (which already includes pitch/emotion scores).

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

## Recent Changes

### November 5, 2025 (Latest) - Portfolio Change Constraint

**New Validation Rule:**
- Added 20% total portfolio change limit per round (from Round 2 onwards)
- Total change = sum of absolute differences across all four assets (Equity, Debt, Gold, Cash)
- Example: If previous round was E40% D30% G20% C10%, and new allocation is E45% D25% G20% C10%, total change = |5| + |-5| + |0| + |0| = 10% ✓
- Teams can see their current total change percentage in the TeamInput table
- Validation prevents submission if any team exceeds the 20% limit
- Round 1 is exempt from this constraint (no previous allocation to compare)

**UI Enhancements:**
- Previous allocation values displayed below each input field in faint, italic, small text (e.g., "prev: 40%")
- All input boxes (asset allocations, pitch, emotion) align in a straight horizontal line
- Number input spinner arrows removed for cleaner, direct value entry
- Helps teams make informed decisions while staying within 20% change constraint
- Non-editable reference text for quick comparison

### November 5, 2025 - Dramatic Animations & Phase-Specific Styling

**Visual Enhancements:**
- Phase-specific background colors for color card sections with white text for maximum drama:
  - Green Phase: #2e8b57 (sea green background)
  - Blue Phase: #1e88e5 (bright blue background)
  - Orange Phase: #f57c00 (vibrant orange background)
  - Red Phase: #c62828 (deep red background)
- Black background (#000000 at 90% opacity) with white/purple text for black card sections
- 2.5 second dice rolling animation before color card reveal (Virtual mode)
- 2.5 second black card drawing animation with spinning shuffle icon
- Enhanced visual feedback makes game rounds more engaging and dramatic

**UI Improvements:**
- "Manage Cards" button removed from active game leaderboard (still available on welcome screen)
- Color card sections now display with phase-appropriate backgrounds and borders
- Black card sections styled with dark theme for dramatic effect
- Animated loading states with bouncing dice/shuffle icons

### November 5, 2025 - End Game Navigation Fix

**Problem Identified:**
- End Game button successfully reset backend data but Dashboard remained showing empty Leaderboard instead of Welcome screen
- Multiple approaches attempted: `setLocation("/")`, `refetchQueries()`, `invalidateQueries()`, `setQueryData()` - all failed

**Root Cause:**
- React Query cache not properly resetting to initial state after game reset
- Component re-render timing issues with various cache update methods

**Final Solution:**
- Use `queryClient.resetQueries()` to reset all queries to initial undefined state
- This forces Dashboard component to re-render with `hasStarted = false`
- Dashboard conditional rendering: `if (!hasStarted)` shows Welcome screen

**Implementation:**
```typescript
// Dashboard.tsx - resetGameMutation onSuccess
queryClient.resetQueries({ queryKey: ["/api/teams"] });
queryClient.resetQueries({ queryKey: ["/api/game-state"] });
queryClient.resetQueries({ queryKey: ["/api/rounds"] });
queryClient.resetQueries({ queryKey: ["/api/allocations"] });
```

**Verified Behavior:**
- Click "End Game" → Confirm → CSV downloads → Queries reset → Welcome screen instantly displays
- Clean transition from Leaderboard to "Welcome to CycleSense" screen with "New Game" and "Manage Cards" buttons

### November 5, 2025 (Later) - In-Person Mode Color Card Dropdown

**In-Person Mode Color Card Selection:**
- Changed from random "Draw Card" button to dropdown selection (like black cards)
- Workflow: Select phase → Select card number from dropdown → Card text appears → Click "Select Card"
- Dropdown filtered by selected phase
- Card text previews below dropdown before confirming selection
- "Select Different Card" button allows changing selection
- Consistent UX with black card selection

### November 5, 2025 (Earlier) - Card Display & Black Card Draw Improvements

**Card Display Simplification:**
- Removed "Title" field from all color card displays (both Virtual and In-Person modes)
- Color cards now show only: Card Number and Market Event (card text)
- Cleaner, more focused card presentation

**Virtual Mode Black Card Draw Flow:**
- Draw Random Black Card now shows drawn card before applying
- Displays card number and card text in purple-bordered panel
- "Apply Market Impact" button to confirm and apply black card
- "Draw Different Card" button to redraw if desired
- NAV recalculation occurs only after clicking "Apply Market Impact"

**In-Person Mode Black Card Selection:**
- Dropdown shows only card numbers (no titles or asset modifiers)
- After selecting card number, card text appears below dropdown
- Clean, minimal selection interface