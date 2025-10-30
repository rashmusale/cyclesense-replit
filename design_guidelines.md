# CycleSense Leaderboard Design Guidelines

## Design Approach

**System Selection:** Material Design with competitive gamification elements
- Data-dense enterprise application requiring clear information hierarchy
- Real-time facilitator operation demands large touch targets and keyboard-friendly interactions
- Competitive leaderboard context benefits from visual engagement and status indicators

**Design Inspiration:** Linear (clean data presentation) + Notion (forms and tables) + Google Material (enterprise patterns)

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for numerical data, NAV values, percentages)

**Hierarchy:**
- Page Headers: text-4xl font-bold (facilitator console titles)
- Section Headers: text-2xl font-semibold (round summary, leaderboard sections)
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Data Values: text-base font-medium (NAV, scores) or text-lg font-mono font-bold (emphasis on key metrics)
- Form Labels: text-sm font-medium
- Body Text: text-base font-normal
- Helper Text: text-sm text-opacity-70

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Compact spacing for data tables: gap-2, p-2
- Standard component spacing: p-4, gap-4, space-y-6
- Section separation: py-8, py-12, mb-16
- Page margins: px-4 (mobile), px-8 (desktop), max-w-7xl mx-auto

**Grid Systems:**
- Dashboard: Single column with full-width table
- Round Input Console: 2-column grid (lg:grid-cols-2) for team input cards
- Configure Teams: Single column form with inline edit rows
- Round Summary: Full-width results table with color-coded header

## Component Library

### Navigation & Header
**Primary Header:**
- Fixed top navigation (sticky top-0 z-50)
- App title "CycleSense Leaderboard" (text-2xl font-bold) with simulation icon
- Quick action buttons in header: "New Round" (primary), "Configure Teams" (secondary)
- Current game status indicator (badge showing round number)
- Header height: h-16, with px-8 horizontal padding

### Buttons
**Size Variants (Facilitator-First):**
- Primary Actions: px-8 py-4 text-lg font-semibold (extra large for live facilitation)
- Secondary Actions: px-6 py-3 text-base font-medium
- Tertiary/Icon Actions: px-4 py-2 text-sm

**Visual Treatment:**
- Primary: Bold, high contrast, rounded-lg
- Secondary: Outlined with medium weight border
- Destructive: High contrast warning treatment for reset/delete
- Icon Buttons: Square aspect ratio with centered icon

### Data Tables
**Leaderboard Table Structure:**
- Full-width responsive table with sticky header
- Rank column: w-16 with medal icons for top 3 positions (🥇🥈🥉)
- Team Name column: font-semibold text-lg
- NAV column: font-mono text-xl font-bold (primary metric)
- Pitch/Emotion Totals: font-mono text-base with subtle badges
- Row borders: border-b with subtle dividers
- Hover state: Subtle highlight for entire row
- Zebra striping: Alternating row backgrounds for readability

**Round History/Results Tables:**
- Compact row height for data density
- Color-coded phase column with pill badges
- Numerical columns right-aligned with monospace font
- Delta indicators: +/- symbols with semantic meaning
- Expandable rows for detailed team allocations

### Forms
**Round Input Console:**
- Team input cards organized in 2-column grid
- Each card: Elevated surface with team name header (text-xl font-bold)
- Form sections clearly labeled with consistent spacing (space-y-6)
- Input groups: Label above, input below with helper text
- Allocation inputs: 4-column grid (Equity/Debt/Gold/Cash) with percentage inputs
- Live validation: Sum to 100% indicator below allocations
- Range inputs for rebalance percentage with visual slider (0-20%)
- Dropdown selects for emotion tokens with icon indicators
- Number inputs for pitch/emotion points with +/- steppers
- Portfolio return input: Large, prominent with % suffix

**Configure Teams Form:**
- Inline edit rows for existing teams (click to edit)
- Add new team: Prominent button at top with slide-down form
- Team list: Card layout with team name, current NAV, and action buttons
- Delete confirmation: Inline warning with undo option

### Badges & Status Indicators
**Phase Color Badges:**
- Pill-shaped with bold text (px-3 py-1 rounded-full font-semibold text-sm)
- Green Phase: Vibrant treatment
- Blue Phase: Cool treatment  
- Orange Phase: Warm treatment
- Red Phase: High-alert treatment
- Always include phase icon or emoji indicator

**Black Card Chips:**
- Compact pill badges (px-2.5 py-0.5 rounded text-xs font-medium)
- Distinct visual from phase badges
- Inline with scenario codes

**NAV Change Indicators:**
- Directional arrows (↑↓) with semantic meaning
- Percentage change in parentheses
- Positive/negative/neutral visual treatment

### Modals & Overlays
**Confirmation Modals (Reset Game):**
- Centered overlay with backdrop blur
- Modal width: max-w-md
- Header with warning icon and bold title
- Body text clearly explaining consequences
- Footer with cancel (secondary) and confirm (destructive) buttons
- Checkbox options for "Keep Teams" vs "Clear All Data"

**Toast Notifications:**
- Top-right positioned (fixed top-4 right-4)
- Auto-dismiss after 4 seconds
- Success/Error/Info variants with icons
- Slide-in animation from right
- Stacked if multiple (space-y-2)

### Dashboard/Leaderboard Screen
**Layout Structure:**
- Hero section: Current round status card (if game active)
  - Large round number display (text-6xl font-bold)
  - Phase badge and scenario code
  - Quick stats: Teams playing, rounds completed
- Primary action row: 3 large buttons (Start New Game / Configure Teams / Start Next Round)
- Main leaderboard table: Full-width with top 3 highlighted
- Secondary metrics cards: Total rounds, average NAV, top performer highlight

### Round Summary Screen
**Layout Structure:**
- Round header card:
  - Round number and phase badge (large display)
  - Scenario code and optional black card
  - Timestamp
- Results breakdown table:
  - Team column with rank
  - Before NAV → Portfolio Return → +Pitch → +Emotion → After NAV columns
  - Visual flow with arrows between columns
  - Summary row at bottom
- Action buttons: "View Leaderboard" (primary) and "Export Round" (secondary)

### Admin/Settings
**Reset Game Section:**
- Danger zone card with warning border
- Clear explanation of reset options
- Two-step confirmation (checkbox + button)
- Recent backup indicator (if applicable)

## Data Visualization
**NAV Trajectory (Nice-to-Have):**
- Inline sparklines for each team in leaderboard (mini line charts)
- Full history page: Multi-line chart with team color coding
- Round markers on timeline
- Hover tooltips showing exact values

## Responsive Behavior
**Mobile (< 768px):**
- Single column layouts
- Stacked team input cards (1 per screen)
- Horizontal scroll for wide tables
- Simplified navigation (hamburger menu)
- Larger touch targets (min 44x44px)

**Tablet (768px - 1024px):**
- 2-column team input grid maintained
- Tables with horizontal scroll if needed
- Side-by-side form elements

**Desktop (> 1024px):**
- Full multi-column layouts
- All tables visible without scroll
- Sidebar navigation possible for admin sections

## Interaction Patterns
**Facilitator-Optimized:**
- Keyboard shortcuts for primary actions (Space to advance, Esc to cancel)
- Auto-save indicators on round input forms
- Confirmation for destructive actions only
- Minimal clicks for common workflows (start round → input data → view results)

**No Images Required:**
This is a data-focused utility application - no hero images or decorative photography needed. Visual interest comes from:
- Color-coded phase system
- Typography hierarchy
- Data visualization (charts, sparklines)
- Status badges and indicators
- Clear iconography from Heroicons

Icons: Use Heroicons (outline style) via CDN for all UI icons (trophy, chart, users, settings, etc.)