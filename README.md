# Google Calendar Clone

A full-featured calendar application built with Next.js 14, featuring Google Calendar integration, real-time event synchronization, and a modern, responsive UI.

![Calendar Demo](./docs/demo.png)
![alt text](<WhatsApp Image 2025-11-14 at 21.14.34_56d69ea1.jpg>)

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [Business Logic & Edge Cases](#business-logic--edge-cases)
- [Animations & Interactions](#animations--interactions)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Google Calendar Integration](#google-calendar-integration)
- [Future Enhancements](#future-enhancements)
- [Troubleshooting](#troubleshooting)

---

## Features

### Core Functionality
- ✅ **Multiple View Modes**: Month, Week, and Day views
- ✅ **Event Management**: Create, read, update, and delete events
- ✅ **Google Calendar Sync**: Two-way sync with Google Calendar
- ✅ **Task Management**: Create and track tasks with due dates
- ✅ **Appointments**: Schedule appointments with duration and buffer time
- ✅ **Guest Management**: Invite guests to events with email notifications
- ✅ **Authentication**: Secure OAuth 2.0 with Google Sign-In
- ✅ **Persistent Storage**: PostgreSQL database with Neon
- ✅ **Real-time Updates**: Server actions with optimistic UI updates
- ✅ **Responsive Design**: Mobile-first, works on all screen sizes

### User Experience
- 🎨 Clean, modern UI inspired by Google Calendar
- 🌓 Smooth animations and transitions
- 📱 Mobile-responsive sidebar and navigation
- 🔔 Success/error notifications
- 🎯 Click-to-create events on calendar
- 📅 Mini calendar for quick date navigation
- 🔍 Event search and filtering (planned)

---

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with Server Components
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Zustand** - Lightweight state management
- **Day.js** - Date manipulation library

### Backend
- **Next.js API Routes** - Serverless functions
- **NextAuth.js v5** - Authentication library
- **Drizzle ORM** - Type-safe SQL ORM
- **Neon** - Serverless PostgreSQL
- **Google APIs** - Calendar and OAuth integration

### DevOps & Tools
- **Drizzle Kit** - Database migrations
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

---

## Architecture

### Project Structure

```
google-calendar/
├── app/
│   ├── actions/              # Server actions
│   │   ├── event-actions.ts
│   │   ├── task-actions.ts
│   │   └── appointment-actions.ts
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/  # Auth API routes
│   ├── auth/
│   │   └── signin/           # Sign-in page
│   └── page.tsx              # Home page
├── components/
│   ├── auth/                 # Authentication components
│   ├── header/               # Header and navigation
│   ├── sidebar/              # Sidebar components
│   ├── ui/                   # Reusable UI components
│   ├── MainView.tsx          # Main calendar container
│   ├── month-view.tsx        # Month view
│   ├── week-view.tsx         # Week view
│   ├── day-view.tsx          # Day view
│   ├── event-popover.tsx     # Event creation modal
│   └── event-summary-popover.tsx  # Event details modal
├── db/
│   ├── schema.ts             # Database schema
│   ├── drizzle.ts            # DB client (edge-compatible)
│   └── drizzle-server.ts     # DB client (server-side)
├── lib/
│   ├── store.ts              # Zustand stores
│   ├── google-calendar.ts    # Google Calendar API client
│   └── utils.ts              # Utility functions
├── auth.ts                   # NextAuth configuration
└── middleware.ts             # Authentication middleware
```

### Architecture Decisions

#### 1. **Hybrid Rendering Strategy**
- **Server Components**: Used for data fetching (events, tasks)
- **Client Components**: Used for interactive UI (calendar views, modals)
- **Server Actions**: For mutations (create, update, delete)

**Why**: Maximizes performance by rendering on the server where possible, while maintaining rich interactivity.

#### 2. **Database Strategy**
- **Two Database Clients**:
  - `db` (Neon HTTP): Edge-compatible for NextAuth adapter
  - `dbServer` (Neon HTTP): Server-side for actions

**Why**: NextAuth v5 with JWT sessions + middleware requires edge compatibility. Separating clients prevents runtime errors.

#### 3. **Session Strategy: JWT**
- Sessions stored in encrypted cookies
- Account tokens stored in database
- Manual token persistence in JWT callback

**Why**:
- Edge/middleware compatibility
- Better performance (no DB lookup per request)
- Still supports OAuth token refresh via database

#### 4. **State Management**
- **Zustand**: Client-side state (view mode, selected date, UI state)
- **Server State**: Events/tasks fetched server-side, passed as props
- **Optimistic Updates**: Immediate UI feedback with revalidation

**Why**: Zustand is lightweight and doesn't require context providers. Server state stays fresh via Next.js caching.

#### 5. **Google Calendar Integration**
- **OAuth 2.0 Flow**: NextAuth handles authentication
- **Token Storage**: Database stores refresh tokens
- **API Client**: Custom wrapper around googleapis
- **Two-way Sync**:
  - Events created locally → synced to Google Calendar
  - Google Calendar event ID stored in database
  - Updates/deletes propagate to Google Calendar

**Why**: Ensures data consistency and allows users to manage events from multiple clients.

---

## Setup and Installation

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **PostgreSQL Database** (Neon recommended)
- **Google Cloud Project** with OAuth 2.0 credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd google-calendar-clone
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Database Setup

#### Option A: Use Neon (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Create a database
createdb google_calendar_db
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Configure OAuth consent screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (or "Internal" for workspace)
   - Fill in app name, support email, developer contact
   - Add scopes: `email`, `profile`, `https://www.googleapis.com/auth/calendar`
   - Add test users (if external)
5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Copy Client ID and Client Secret

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth Configuration
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Generate AUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 6. Database Migration

Push the schema to your database:

```bash
npx drizzle-kit push
```

Or generate and run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

### Development Tips

- **Database Studio**: View your database with Drizzle Studio
  ```bash
  npx drizzle-kit studio
  ```

- **Type Checking**: Run TypeScript compiler
  ```bash
  npx tsc --noEmit
  ```

- **Linting**: Check code quality
  ```bash
  npm run lint
  ```

---

## Business Logic & Edge Cases

### Event Management

#### 1. **Event Creation**
- Events require: title, description, date, time
- Default duration: 1 hour
- Optional: guest emails (comma-separated)
- Created in both local DB and Google Calendar
- Google Calendar event ID stored for sync

**Edge Cases Handled**:
- Empty/whitespace-only titles rejected
- Invalid date formats caught and displayed
- Google Calendar API failures rolled back locally
- Duplicate email handling in guest list
- Network timeout handling

#### 2. **Event Updates**
- Fetches existing event from DB
- Verifies user ownership
- Updates both DB and Google Calendar
- Sends email notifications if guests changed

**Edge Cases Handled**:
- Concurrent updates (last-write-wins)
- Orphaned Google Calendar events (graceful fallback)
- Unauthorized access prevention
- Partial update failures

#### 3. **Event Deletion**
- Soft delete approach (could be implemented)
- Hard delete from both DB and Google Calendar
- Cascade delete with user accounts

**Edge Cases Handled**:
- Already deleted events
- Google Calendar sync failures (warns user)
- Referential integrity maintained

### Date & Time Handling

#### 1. **Timezone Management**
- All times stored in UTC
- Displayed in user's local timezone
- Day.js for date manipulation

**Edge Cases Handled**:
- DST transitions
- Cross-timezone event scheduling
- Midnight boundary events

#### 2. **View Navigation**
- Month view: Shows current month + overflow days
- Week view: Sunday-Saturday or Monday-Sunday
- Day view: Hourly breakdown

**Edge Cases Handled**:
- Leap years
- Month boundaries
- Empty calendar days

### Authentication & Authorization

#### 1. **OAuth Flow**
- Sign in with Google
- Request calendar permissions
- Store refresh token for long-term access
- JWT sessions for performance

**Edge Cases Handled**:
- Missing refresh token (re-auth prompt)
- Expired access tokens (auto-refresh)
- Revoked permissions (clear error messages)
- Multiple device sessions

#### 2. **Authorization**
- Middleware protects all non-auth routes
- User ID attached to all events/tasks
- Row-level security in queries

**Edge Cases Handled**:
- Unauthorized API access (403 errors)
- Session expiry during form submission
- CSRF protection via NextAuth

### Data Synchronization

#### 1. **Google Calendar Sync**
- Local create → Google Calendar create
- Local update → Google Calendar update
- Local delete → Google Calendar delete

**Current Limitations** (Future Enhancements):
- No Google → Local sync (one-way only)
- No recurring event support
- No conflict resolution for external changes

#### 2. **Conflict Detection**
- Simple last-write-wins strategy
- No overlap detection currently

**Future Enhancements**:
- Two-way sync with webhooks
- Conflict resolution UI
- Event overlap warnings
- Recurring event patterns

### Tasks & Appointments

#### 1. **Tasks**
- Lightweight to-do items
- Optional due dates
- Completion tracking
- No Google Calendar sync

**Edge Cases Handled**:
- Overdue tasks (visual indicator could be added)
- Tasks without due dates
- Bulk completion

#### 2. **Appointments**
- Includes duration and buffer time
- Location support
- Guest management
- Synced to Google Calendar

**Edge Cases Handled**:
- Buffer time calculations
- Appointment overlaps (warning could be added)
- Duration validation

---

## Animations & Interactions

### Component Animations

#### 1. **Tailwind CSS Animations**
- `tailwindcss-animate` plugin for utility classes
- Smooth transitions on hover states
- Fade-in/fade-out for modals

**Examples**:
```tsx
// Popover entrance
className="animate-in fade-in-0 zoom-in-95"

// Hover states
className="transition-colors hover:bg-accent"

// Slide transitions
className="transition-transform duration-300"
```

#### 2. **Radix UI Animations**
- Built-in animations for primitives
- Accordion expand/collapse
- Select dropdown transitions
- Avatar loading states

#### 3. **Custom Interactions**

**Click-to-Create Events**:
- Click any calendar cell → opens event popover
- Pre-fills date from clicked cell
- Smooth modal transition

**Date Navigation**:
- Previous/Next month buttons
- Today button (jumps to current date)
- Mini calendar date selection
- Smooth view transitions

**Event Hovering**:
- Hover shows event details
- Click opens full event summary
- Edit/Delete actions visible on hover

**Sidebar Toggle**:
- Animated slide-in/slide-out
- Responsive collapse on mobile
- State persisted in localStorage

### Responsive Behavior

- **Desktop (>1024px)**: Full sidebar + calendar grid
- **Tablet (768px-1024px)**: Collapsible sidebar
- **Mobile (<768px)**: Hidden sidebar, hamburger menu

### Loading States

- **Optimistic Updates**: UI updates immediately
- **Pending States**: Disabled buttons during submission
- **Error Handling**: Toast notifications for failures
- **Skeleton Screens**: Could be added for initial load

### Accessibility

- **Keyboard Navigation**: Tab through interactive elements
- **ARIA Labels**: Screen reader support
- **Focus Management**: Logical focus flow
- **Color Contrast**: WCAG AA compliant

---

## Database Schema

### Users Table
```sql
user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  emailVerified TIMESTAMP,
  image TEXT
)
```

### Accounts Table (OAuth Tokens)
```sql
account (
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,        -- For Google Calendar API
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, providerAccountId)
)
```

### Events Table
```sql
events (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  googleEventId TEXT,         -- Google Calendar event ID
  date TIMESTAMP NOT NULL,
  endDate TIMESTAMP,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  guests TEXT                 -- Comma-separated emails
)
```

### Tasks Table
```sql
tasks (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  googleTaskId TEXT,          -- Future Google Tasks integration
  title TEXT NOT NULL,
  description TEXT,
  dueDate TIMESTAMP,
  completed INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
)
```

### Appointments Table
```sql
appointments (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  googleEventId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  duration INTEGER,           -- Minutes
  bufferTime INTEGER,         -- Minutes
  location TEXT,
  guests TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
)
```

### Sessions Table (NextAuth)
```sql
session (
  sessionToken TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
)
```

---

## Authentication Flow

### Sign-In Process

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen
   - Requests permissions: email, profile, calendar

2. **Google authorization**
   - User approves permissions
   - Google redirects back with authorization code

3. **Token exchange**
   - NextAuth exchanges code for tokens
   - Receives: access_token, refresh_token, expires_at

4. **User & Account creation**
   - NextAuth adapter creates user record
   - JWT callback manually saves account tokens to DB
   - JWT session created (no database session)

5. **Session established**
   - Encrypted JWT stored in cookie
   - User redirected to home page
   - Middleware validates JWT on future requests

### Token Management

**Access Token Refresh**:
```typescript
// When access token expires:
1. getGoogleCalendarClient() detects expiry
2. oauth2Client automatically refreshes using refresh_token
3. 'tokens' event fires → updates DB with new tokens
4. API call proceeds with fresh token
```

**Token Storage Architecture**:
- **JWT Session**: Contains only user ID
- **Database Account**: Contains OAuth tokens
- **Why Both?**: JWT for fast middleware, DB for API calls

### Security Features

- **CSRF Protection**: Built into NextAuth
- **XSS Protection**: HttpOnly cookies
- **Token Encryption**: AES-256-GCM
- **Secure Cookies**: SameSite=Lax, Secure flag in production
- **Authorization Checks**: Every server action validates user ID

---

## Google Calendar Integration

### API Client (`lib/google-calendar.ts`)

```typescript
// Main functions:
- getGoogleCalendarClient()      // Initializes authenticated client
- createGoogleCalendarEvent()    // Creates event
- updateGoogleCalendarEvent()    // Updates event
- deleteGoogleCalendarEvent()    // Deletes event
- getGoogleCalendarEvents()      // Fetches events (future)
```

### Event Synchronization

**Create Flow**:
```
User submits form
  ↓
createEvent() server action
  ↓
createGoogleCalendarEvent()
  ↓
Google Calendar API creates event
  ↓
Returns googleEventId
  ↓
Insert into local DB with googleEventId
  ↓
Revalidate cache
  ↓
UI updates
```

**Update Flow**:
```
User edits event
  ↓
Fetch event from DB (get googleEventId)
  ↓
updateGoogleCalendarEvent(googleEventId, newData)
  ↓
Update Google Calendar
  ↓
Update local DB
  ↓
Revalidate cache
```

**Delete Flow**:
```
User deletes event
  ↓
Fetch event from DB
  ↓
deleteGoogleCalendarEvent(googleEventId)
  ↓
Delete from Google Calendar
  ↓
Delete from local DB
  ↓
Revalidate cache
```

### Error Handling

```typescript
// Graceful degradation:
try {
  const googleEventId = await createGoogleCalendarEvent(data);
  await dbServer.insert(events).values({ ...data, googleEventId });
} catch (error) {
  // If Google Calendar fails, event not created locally either
  return { error: 'Failed to create event. Please try again.' };
}
```

### Refresh Token Flow

```typescript
oauth2Client.setCredentials({
  access_token: account.access_token,
  refresh_token: account.refresh_token,
  expiry_date: account.expires_at * 1000,
});

// Auto-refresh on expiry:
oauth2Client.on('tokens', async (tokens) => {
  // Save new tokens to database
  await dbServer.update(accounts).set({
    access_token: tokens.access_token,
    expires_at: tokens.expiry_date / 1000,
    refresh_token: tokens.refresh_token ?? account.refresh_token,
  });
});
```

---

## Future Enhancements

### High Priority

1. **Two-Way Sync with Google Calendar**
   - Implement webhooks for push notifications
   - Poll for changes periodically
   - Conflict resolution UI
   - Sync status indicator

2. **Recurring Events**
   - Support RRULE format (RFC 5545)
   - Daily, weekly, monthly, yearly patterns
   - Custom recurrence rules
   - Edit single occurrence vs. series

3. **Event Overlap Detection**
   - Warn when scheduling conflicts occur
   - Visual indicator on calendar
   - Auto-suggest alternative times

4. **Search & Filtering**
   - Full-text search across events
   - Filter by date range, guests, type
   - Search autocomplete
   - Saved searches

5. **Drag-and-Drop**
   - Drag events to reschedule
   - Drag to resize (change duration)
   - Multi-day event spanning

### Medium Priority

6. **Notifications**
   - Email reminders before events
   - Push notifications (PWA)
   - SMS reminders (Twilio)
   - Configurable reminder times

7. **Calendar Sharing**
   - Share calendar with other users
   - View-only vs. edit permissions
   - Public calendar URLs
   - Embed calendars

8. **Multiple Calendars**
   - Create separate calendars (Work, Personal, etc.)
   - Color-coding per calendar
   - Show/hide individual calendars
   - Import external calendars (ICS)

9. **Time Zone Support**
   - Display events in different timezones
   - Time zone converter
   - Multi-timezone event scheduling
   - Daylight saving time handling

10. **Mobile App**
    - React Native or Progressive Web App
    - Native mobile interactions
    - Offline support
    - Mobile-optimized UI

### Low Priority

11. **Advanced Scheduling**
    - Find meeting times (like Calendly)
    - Availability sharing
    - Booking pages
    - Round-robin scheduling

12. **Integrations**
    - Zoom/Google Meet integration
    - Slack notifications
    - Microsoft Outlook sync
    - Apple Calendar sync

13. **Analytics**
    - Time tracking per calendar
    - Meeting statistics
    - Productivity insights
    - Export to CSV/PDF

14. **Customization**
    - Theme customization
    - Custom color schemes
    - Font size preferences
    - Week start day preference

15. **Collaboration**
    - Commenting on events
    - @mentions
    - Event chat
    - Collaborative editing

### Technical Improvements

16. **Performance**
    - Event virtualization for large calendars
    - Incremental Static Regeneration
    - Service worker caching
    - Optimize bundle size

17. **Testing**
    - Unit tests (Vitest)
    - Integration tests (Playwright)
    - E2E tests
    - Visual regression tests

18. **Accessibility**
    - Full keyboard navigation
    - Screen reader optimization
    - High contrast mode
    - Reduced motion support

19. **Internationalization**
    - Multi-language support
    - Date format localization
    - Timezone localization
    - RTL language support

20. **DevOps**
    - CI/CD pipeline
    - Automated deployments
    - Database backups
    - Monitoring & alerting

---

## Troubleshooting

### Common Issues

#### 1. "No refresh token available"

**Cause**: Google OAuth didn't return a refresh token, or it wasn't saved.

**Solution**:
1. Sign out completely
2. Revoke app permissions: [Google Account Permissions](https://myaccount.google.com/permissions)
3. Sign in again - this forces `prompt=consent`

#### 2. "Error connecting to database: fetch failed"

**Cause**: Database connection issue, often in middleware/edge runtime.

**Solution**:
- Verify `DATABASE_URL` is correct
- Check if using `db` vs `dbServer` correctly:
  - `db` → Only in auth.ts adapter
  - `dbServer` → Server actions, API routes

#### 3. Google Calendar API 403 Forbidden

**Cause**: Calendar API not enabled or OAuth scope missing.

**Solution**:
1. Enable Google Calendar API in Cloud Console
2. Verify OAuth scopes include `https://www.googleapis.com/auth/calendar`
3. Re-authenticate

#### 4. NextAuth callback URL mismatch

**Cause**: Redirect URI not configured in Google OAuth.

**Solution**:
1. Add to Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
2. Match `AUTH_URL` in `.env.local`

#### 5. TypeScript errors after npm install

**Cause**: Type definitions out of sync.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 6. Events not appearing after creation

**Cause**: Cache not revalidated or database write failed.

**Solution**:
- Check server logs for errors
- Verify `revalidatePath("/")` is called
- Hard refresh browser (Cmd/Ctrl + Shift + R)

### Debug Mode

Enable debug logging:

```bash
# .env.local
DEBUG=next-auth:*
NODE_ENV=development
```

View logs in terminal where `npm run dev` is running.

### Database Issues

**View database contents**:
```bash
npx drizzle-kit studio
```

**Reset database** (⚠️ Deletes all data):
```bash
npx drizzle-kit drop
npx drizzle-kit push
```

### Still Stuck?

1. Check [Next.js Docs](https://nextjs.org/docs)
2. Check [NextAuth.js Docs](https://authjs.dev)
3. Check [Google Calendar API Docs](https://developers.google.com/calendar)
4. Open an issue on GitHub

---

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [NextAuth.js](https://authjs.dev/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Google Calendar API](https://developers.google.com/calendar) - Calendar integration

---

Thank you!!
