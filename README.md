# SponsorDesk ⚡

> **Every sponsor. Every follow-up. Under control.**  
> The complete B2B Sponsorship CRM & AI Pitch Studio for college fest organizers, cultural clubs, and student societies.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-20_Passing_Tests-FCC72B?style=flat&logo=vitest&logoColor=black)](https://vitest.dev/)

---

## 1. Product Vision & Problem

College festivals (such as **Vivacity at LNMIIT Jaipur**, Mood Indigo, Rendezvous) and university clubs raise tens of lakhs in corporate sponsorships each year. Traditionally, student teams manage corporate outreach across scattered WhatsApp groups, personal notes, and messy spreadsheets.

This results in:
- **Lost Sponsor Leads & Contacts**: Student turnover each year causes sponsor relationships to vanish.
- **Forgotten Follow-ups**: 80% of deals close on the 3rd or 4th touchpoint, yet student teams forget follow-ups amidst exam and event schedules.
- **Inconsistent Sponsorship Pitches**: Inexperienced organizers send generic, poorly formatted emails that get rejected by corporate brand managers.
- **Blind Pipeline Visibility**: Fest heads cannot accurately forecast closed revenue or track committee members' outreach progress.

**SponsorDesk** solves this by providing one unified workspace: an interactive 7-stage Kanban pipeline, an AI Pitch Studio powered by Gemini, an automated follow-up command center, a package tier builder with a 1-page PDF proposal generator, and honest conversion analytics.

---

## 2. Key Features

### 🎯 7-Stage Sponsorship Pipeline (Kanban)
- Drag-and-drop sponsor cards across 7 explicit stages: `Lead` → `Contacted` → `Replied` → `Meeting Scheduled` → `Negotiation` → `Closed Won` → `Closed Lost`.
- Accessible stage-change selector for mobile devices and keyboard navigation.
- Real-time search, industry category filtering, tier package filtering, and deal value sorting.
- Quick "Add Lead" directly into any stage.

### ✨ Gemini AI Pitch Studio
- Server-side integration with **Google Gemini 1.5 Flash** SDK (`@google/generative-ai`).
- **Strict Anti-Fabrication Safeguards**: Uses only verified event parameters, expected attendance, and package benefits.
- Multi-channel formatting:
  - **Email**: Tailored subject line + structured message with event intro, value proposition, and student sign-off.
  - **WhatsApp**: Conversational, bulleted highlights with emojis (under 180 words).
  - **LinkedIn**: Concise InMail pitch under 250 words.
- In-studio controls: More Formal, More Persuasive, Real-time editing, Copy to Clipboard, Save to Prospect, and "Confirm Sent" logging.
- Built-in Demo Pitch Engine fallback when API keys are not supplied.

### 📅 Follow-up Command Center
- Tracks upcoming, due today, and overdue follow-up tasks.
- Categorized by priority: `High`, `Medium`, `Low`.
- Prominent overdue warnings to prevent warm leads from turning cold.
- 1-click completion and rapid rescheduling.
- Every task links directly to its sponsor profile.

### 🏆 Sponsorship Tier Builder & 1-Page Proposal PDF Generator
- Manage sponsorship tiers (Title Sponsor, Gold Sponsor, Silver Sponsor, Associate Sponsor, Custom).
- Configure deliverables (stage naming rights, experiential stall dimensions, social media reels, VIP passes).
- **1-Page A4 Proposal Generator**: Formats a clean, high-impact sponsorship proposal scaled to fit on a single printed A4 page. Includes instant browser print and PDF download (`Ctrl + P` / print styles).

### 📊 Honest Conversion Analytics
- Calculated directly from persisted database records (no fake hardcoded stats):
  - **Win Rate**: $\frac{\text{Deals Won}}{\text{Deals Won} + \text{Deals Lost}} \times 100$
  - **Reply Rate**: $\frac{\text{Prospects Replied or Beyond}}{\text{Prospects Contacted or Beyond}} \times 100$
  - **Pipeline Value vs. Closed Value**
  - **Follow-up Completion Rate**
  - **Stage-by-Stage Funnel Conversion**

### 👥 Multi-Tenant Supabase Architecture with Row Level Security (RLS)
- Normalized PostgreSQL database schema with migration files in `supabase/migrations/`.
- Full Row Level Security (RLS) enforcing workspace membership checks on every table (`profiles`, `workspaces`, `workspace_members`, `prospects`, `sponsorship_tiers`, `follow_ups`, `pitches`, `activity_logs`).
- Zero service-role keys exposed to the client bundle.

### 🧪 Pre-Seeded Demo Mode (LNMIIT Vivacity 2026)
- Pre-seeded with authentic festival data: Northwest India's premier cultural fest **Vivacity 2026** at **LNMIIT Jaipur** (25,000+ expected footfall).
- 14 realistic fictional sponsor prospects across all 7 stages (Fintech, EdTech, Cloud, Beverages, Quick-Commerce, Streetwear, Esports, etc.).
- Overdue, due today, and completed follow-up tasks.
- Saved sample pitches and an activity audit log.
- 1-click "Reset Demo" button in the sidebar and settings.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript (Strict), Tailwind CSS |
| **Icons & UI** | Lucide React, Custom accessible modal & toast design system |
| **Data & Auth** | Supabase (PostgreSQL, Auth, SSR cookies, Row Level Security) |
| **Universal Store** | Universal Data Store & Demo Sandbox Engine for instant evaluation |
| **AI Integration** | Google Gemini API (`@google/generative-ai`), server-side only |
| **Testing** | Vitest, React Testing Library, JSDOM (20/20 passing tests) |
| **Deployment** | Vercel (Frontend & Serverless routes), Supabase (PostgreSQL) |

---

## 4. Database Schema & Migration

The schema is defined in `supabase/migrations/20261023000000_sponsordesk_schema.sql`:

1. `profiles`: Linked to `auth.users(id)`.
2. `workspaces`: Multi-tenant festival settings (dates, attendance, audience demographics, currency).
3. `workspace_members`: Role-based membership (`owner`, `admin`, `member`) enforcing tenant boundaries.
4. `prospects`: Sponsor CRM with stages, expected value, agreed value, tier references, and contact info.
5. `sponsorship_tiers`: Tier packages with JSONB deliverables list and prices.
6. `follow_ups`: Scheduled reminders with due dates, priorities, and statuses.
7. `pitches`: Generated AI pitches with channel, tone, subject, and body.
8. `activity_logs`: Immutable audit trail of stage changes, interactions, and follow-ups.

---

## 5. Local Setup Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v24.21.0`)
- npm `v9+` or `v11+`

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd sponsordesk
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase (Optional for Demo mode; required for live cloud database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key

# Google Gemini API (Optional for Demo mode; required for live Gemini AI)
GEMINI_API_KEY=your-gemini-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> **Note**: SponsorDesk runs out-of-the-box in **Demo Mode** even if no `.env.local` keys are provided!

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Running Tests & Quality Verification

Run the automated Vitest test suite:
```bash
npm run test
```
Result: **20 tests passed across 3 test suites**:
- `tests/metrics.test.ts`: Validates pipeline sums, closed values, win rates, and reply rate calculations.
- `tests/utils.test.ts`: Validates INR formatting (`₹2.5 Lakh`, `₹15,00,000`) and dynamic follow-up status calculations.
- `tests/prompts.test.ts`: Validates anti-fabrication prompt rules and multi-channel demo pitch templates.

Run TypeScript strict type checking:
```bash
npm run type-check
```

Run production build:
```bash
npm run build
```

---

## 7. Production Deployment (Vercel & Supabase)

### Step 1: Deploy Database on Supabase
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/migrations/20261023000000_sponsordesk_schema.sql` and run the script. This creates all tables, indexes, triggers, and Row Level Security policies.
4. Copy your **Project URL** and **anon public key** from Project Settings → API.

### Step 2: Deploy Application on Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `GEMINI_API_KEY`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
3. Click **Deploy**. Vercel will build the Next.js application and deploy it globally.

---

## 8. Critical User Workflow Smoke Test Checklist

- [x] **Landing Page**: Visually inspect the hero, 3-step flywheel, and click "Explore Live Demo".
- [x] **Dashboard**: Review summary cards, open pipeline values, closed revenue, and overdue tasks.
- [x] **Kanban Pipeline**: Drag a card from `Lead` to `Contacted`. Verify stage updates and activity is logged.
- [x] **AI Pitch Studio**: Select "SprintDrop Commerce", pick "WhatsApp" channel, generate pitch, edit text, copy to clipboard, and click "Confirm Sent".
- [x] **Follow-up Management**: Filter by "Due Today", complete a task, and verify it updates across the dashboard.
- [x] **Sponsor Database**: Search by company name, filter by stage, export CSV, and open CSV import preview.
- [x] **Sponsorship Tiers**: Open "1-Page Proposal Preview", customize company name, and trigger print/PDF export.
- [x] **Settings**: Update fest dates or click "Reset Demo Workspace Data" to restore initial state.
