# 📊 RAFIKI — COMPREHENSIVE PRODUCT ROADMAP & STRATEGY

**Last Updated:** August 16, 2026  
**Document Version:** 1.0  
**Status:** Ready for Execution

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Product Brief](#product-brief)
3. [Current Product State](#current-product-state)
4. [Feature Inventory](#feature-inventory)
5. [Product Evolution Timeline](#product-evolution-timeline)
6. [Strategic Roadmap (6 Phases)](#strategic-roadmap-6-phases)
7. [90-Day Execution Plan](#90-day-execution-plan)
8. [Metrics & Success Criteria](#metrics--success-criteria)
9. [Risk Analysis & Mitigation](#risk-analysis--mitigation)
10. [Open Product Questions](#open-product-questions)

---

## EXECUTIVE SUMMARY

**Rafiki** is a WhatsApp-based conversational AI assistant connecting job seekers in India with employment opportunities through dynamic, bilingual conversations. The platform syncs jobs from Google Sheets, collects structured applicant data, facilitates KYC compliance, and aggregates user feedback—all with zero-ops deployment via NestJS + Supabase.

### Current Status
- **Stage:** MVP with feature stabilization (Sept 2025–present)
- **Target Users:** Job seekers (18–70 years); HR teams managing hiring
- **Primary Value Proposition:** Frictionless job discovery + conversational application + automated KYC over WhatsApp
- **Revenue Model:** B2B SaaS (employer subscription); job seekers free [INFERRED]

### Key Metrics
| Metric | Current | Target (90d) | Target (6mo) |
|--------|---------|-------------|--------------|
| **MAU** | [UNKNOWN] | 1,000 | 5,000 |
| **Successful Job Matches/Month** | [UNKNOWN] | 50–100 | 200–500 |
| **Application Completion Rate** | [UNKNOWN] | 30%+ | 40%+ |
| **Day 7 Retention** | [UNKNOWN] | 25%+ | 35%+ |
| **NPS Score** | [UNKNOWN] | 40+ | 50+ |

### Team Capacity
- **1 Backend Engineer** (40h/week)
- **1 Frontend Engineer** (40h/week, minimal for 90d)
- **1 Tech Lead** (40h/week, split across code + mentorship + architecture)
- **No QA, DevOps, or Data Engineers**

### Top 3 Priorities (Next 90 Days)
🔴 **P0:** Fix critical production gaps (persistent sessions, observability, auth)  
🟠 **P1:** Validate & improve core funnel (completion rate, funnel metrics)  
🟡 **P2:** Improve retention & optimize performance (notifications, query tuning)

---

## PRODUCT BRIEF

### Problem Statement
1. **For Job Seekers:** Discovering relevant jobs in India is fragmented (multiple apps, limited opportunities in their region, no personalized matching)
2. **For Employers:** Recruiting via WhatsApp is manual and unstructured; no standardized candidate data; high drop-off in application funnel
3. **For Product:** No observability into user behavior; can't measure PMF or optimize retention

### Solution Overview
Rafiki automates the job matching conversation:
- **User initiates:** Sends "hi" via WhatsApp
- **Rafiki responds:** Asks language preference (EN/HI)
- **User browses:** Sees jobs in their city, filtered by role preference
- **Rafiki screens:** Asks role-specific qualifying questions (dynamic, conversational)
- **User applies:** Completes multi-step application; data auto-saved to Google Sheets
- **Employer reviews:** HR team gets structured candidate data; can schedule interviews
- **Feedback loop:** NPS survey captures user satisfaction

### Core User Journeys

#### Journey 1: Discover Jobs → Apply → Get KYC Approved
```
User sends "hi"
  → Select language (EN/HI)
  → Main menu (Job / KYC / Support / Feedback)
  → Browse jobs by city + role
  → Answer screening questions (common: name, age, city; role-specific: experience, skills)
  → Select a job
  → Complete KYC (upload Aadhaar, PAN, Bank Proof)
  → Employer reviews profile
  → Interview scheduled
```

#### Journey 2: Provide Feedback
```
Employer sends NPS survey phone numbers via Google Sheet
  → Rafiki reads numbers at midnight
  → Sends WhatsApp: "Your feedback is important to us"
  → User selects language
  → Multi-question survey (NPS + open-ended + conditional Qs)
  → Responses saved to "Feedback" Google Sheet tab
```

#### Journey 3: Get Customer Support
```
User types "support" or sends "❓"
  → Routed to SupportFlow
  → User types their query
  → Saved to "SupportQueries" Google Sheet
  → HR team reviews + responds manually
```

---

## CURRENT PRODUCT STATE

### What's Shipped ✅

| Feature | Status | Evidence | Maturity |
|---------|--------|----------|----------|
| **WhatsApp Webhook Integration** | ✅ Live | WhatsappController, WhatsappService | Stable |
| **Bilingual Conversation (EN/HI)** | ✅ Live | Flow router, language constants | Stable |
| **Job Discovery + City Filtering** | ✅ Live | job.flow.ts, job_locations table | Stable |
| **Multi-Step Application** | ✅ Live | COMMON + ROLE phases | Stable (frequent bug fixes) |
| **Dynamic Question Generation (OpenAI)** | ✅ Live | openai.service.ts, GPT-4o-mini | Stable |
| **KYC Collection (Aadhaar/PAN/Bank)** | ✅ Live | job.flow KYC phase | MVP (integrated) |
| **Data Export to Google Sheets** | ✅ Live | sheets.service, jobs-export cron | Stable |
| **Job Sync from Google Sheets** | ✅ Live | jobs-sync module, daily cron | Stable |
| **NPS Feedback Collection** | ✅ Live | feedback.flow, NPS targeting | Recently added (Sept 11) |
| **Customer Support Channel** | ✅ Live | support.flow | MVP |
| **Session State Management** | ⚠️ Partial | SessionService (in-memory only) | **CRITICAL GAP:** Ephemeral—lost on restart |
| **Authentication & Authorization** | ❌ Missing | — | **BLOCKING:** Required for multi-tenant SaaS |
| **Multi-Tenancy Isolation** | ❌ Missing | Single Supabase schema | **BLOCKING:** No employer data isolation |
| **Production Observability** | ⚠️ Minimal | Basic console.error | **CRITICAL GAP:** Can't debug production |
| **Metrics & Analytics** | ❌ Missing | No events table, no dashboard | **CRITICAL GAP:** Can't measure PMF |
| **Rate Limiting & DDoS Protection** | ❌ Missing | — | **Risk:** Spam / bot abuse |
| **Interview Scheduling** | ❌ Missing | — | User doesn't hear back after apply |
| **Job Match Notifications** | ❌ Missing | — | Users forget jobs; no re-engagement |
| **Employer Dashboard** | ❌ Missing | — | HR team reviews candidates manually |

### Critical Gaps (Block Scale)
1. **Persistent Sessions:** Server restarts = data loss. Unacceptable in production.
2. **Auth + Multi-Tenancy:** Single employer sees all applicant data. No B2B trust.
3. **Observability:** Production issues are invisible; debugging is guesswork.
4. **Metrics:** No funnel data; iterating blind on retention/completion rates.

---

## FEATURE INVENTORY

### Core/MVP Features

| Feature | User Problem | User | Current State | Dependencies |
|---------|--------------|------|----------------|--------------|
| **Language Selection** | Non-English speakers excluded | Job seekers | Stable (select at start) | SessionService, flow-router |
| **Job Discovery by City/Role** | Don't know what jobs exist; manual search friction | Job seekers | Stable (city/locality filtering) | Supabase jobs schema |
| **Dynamic Application Questions** | Boilerplate forms feel robotic; high drop-off | Job seekers | Stable (GPT-4o-mini rephrasing) | OpenAI, context storage |
| **Multi-Step Job Matching** | Employers need structured screening | Employers | Stable (COMMON + ROLE phases) | ConversationStateService |
| **KYC Collection** | Employers must verify identity | Job seekers + Employers | MVP (integrated into job flow) | Aadhaar/PAN/Bank media upload |
| **Session State Tracking** | Server must remember user context | System | **CRITICAL GAP** (in-memory only) | Supabase sessions table |
| **WhatsApp Message Routing** | Users can't receive/send messages | System | Stable (webhook + API) | WhatsApp Cloud API |

### Growth Features

| Feature | User Problem | Current State | Target (90d) | Target (6mo) |
|---------|--------------|----------------|--------------|--------------|
| **Applicant Data Export** | HR teams download responses manually | Stable (daily cron export) | Optimize latency | Add filtering/columns |
| **Job Inventory Sync** | Employers manually update jobs | Stable (daily cron) | Add real-time sync option | Webhook-driven updates |
| **NPS Feedback** | Product team lacks satisfaction data | Recently added | Analyze + act on feedback | Build dashboard |
| **Customer Support** | Users need help; tickets captured | MVP | Add response SLA tracking | Auto-categorization with ML |

### Retention Features

| Feature | User Problem | Current State | Target Impact |
|---------|--------------|----------------|----------------|
| **Reset Button** | Users stuck in flow; can't restart | Added Sept 12 | Reduce frustration |
| **Feedback Collection** | User voice captured but no follow-up | MVP | Measure satisfaction |
| **Job Notifications** | Users forget about jobs; no re-engagement | Missing | **Increase D7 retention 5–10%** |
| **Interview Follow-up** | No callback after application | Missing | **Increase conversion 2–5%** |

---

## PRODUCT EVOLUTION TIMELINE

Based on git history, architecture, and feature maturity:

### Phase 1: Foundation (Early 2025)
**What:** WhatsApp webhook + basic conversation routing  
**Why:** Need to receive/send messages to have a product  
**User Problem:** "How do we talk to users?"  
**Evidence:** WhatsappService, basic controller  
**Outcome:** Functional chat channel

### Phase 2: Localization (Early–Mid 2025)
**What:** Bilingual language selection (EN/HI)  
**Why:** India market speaks multiple languages; can't ask questions in wrong language  
**User Problem:** "We need to serve Hindi + English speakers"  
**Evidence:** FlowRouter.handleLanguage(), language constants, flow-router state  
**Outcome:** Language-aware conversations

### Phase 3: Core Job Matching (Mid 2025)
**What:** Dynamic job application flow with multi-phase questions  
**Why:** Core product—job seekers apply, employers get structured data  
**User Problem:** "Job forms are boring; users drop off"  
**Evidence:** job.flow.ts (complex, 600+ lines), openai.service.ts, frequent updates  
**Outcome:** Conversational job applications with AI rephrasing

### Phase 4: Data Export + Employer Loop (Mid–Late 2025)
**What:** Google Sheets integration (read jobs, export applicants)  
**Why:** Close the loop—employers need structured data; manual export is pain  
**User Problem:** "We have WhatsApp responses but no structured export"  
**Evidence:** sheets.service.ts, jobs-sync, jobs-export modules  
**Outcome:** Automated data flow: Sheets → DB → Sheets

### Phase 5: KYC + Compliance (Late 2025)
**What:** Integrated KYC flow (Aadhaar, PAN, Bank Proof upload)  
**Why:** Employer requirement for hiring; legal compliance  
**User Problem:** "We can't hire without verified identity"  
**Evidence:** job.flow KYC phase (steps 1–4), appendKycRow()  
**Outcome:** Verified candidate data

### Phase 6: Feedback + Optimization (Sept 2025–Present)
**What:** NPS feedback collection, bug fixes, UX refinement  
**Why:** Retention focus; early users exist, now measure + improve  
**User Problem:** "Are users happy? What should we improve?"  
**Evidence:** "NPS feedback flow" (Sept 11), "add reset button" (Sept 12), multiple fixes  
**Outcome:** Stabilization + feedback loop

---

## STRATEGIC ROADMAP (6 PHASES)

### Phase 0: Discovery / Problem Validation [COMPLETED]
**Status:** ✅ Done (MVP built, early users active)

| Initiative | Status | Success Metric | Notes |
|-----------|--------|-----------------|-------|
| Validate job seeker demand | ✅ | Users active in Sept 2025 | Exists but unquantified |
| Validate employer value | ✅ | Cron jobs running (data exported) | B2B pilot in progress |
| Validate AI UX improves engagement | ✅ | Features deployed | Needs measurement (M1: add analytics) |

---

### Phase 1: MVP [COMPLETED ≈ Mid–Sept 2025]
**Status:** ✅ Done (core features shipped)

| Initiative | Status | Outcome | Evidence |
|-----------|--------|---------|----------|
| WhatsApp webhook + routing | ✅ | Functional messaging channel | WhatsappService, controller |
| Bilingual conversations | ✅ | EN/HI support throughout | Flow router, constants |
| Job discovery + filtering | ✅ | Browse jobs by city/role | job.flow.ts, job_locations |
| Multi-step application | ✅ | Structured candidate data | COMMON + ROLE phases |
| Session state tracking | ⚠️ | Ephemeral only (critical gap) | In-memory SessionService |
| Data export to Sheets | ✅ | Automated applicant export | sheets.service, jobs-export cron |

**MVP Outcome:** Functional end-to-end: User WhatsApp → Apply → Employer sees data in Sheets

---

### Phase 2: Product-Market Fit [IN PROGRESS ≈ Sept 2025–Now]
**Status:** 🟠 In progress (stabilization + feedback loops)

| Initiative | Status | Target | Effort |
|-----------|--------|--------|--------|
| NPS + feedback collection | ✅ | Measure user satisfaction | Deployed |
| Customer support channel | ✅ | Handle user inquiries | MVP |
| Fix UX issues (reset button, bugs) | ✅ | Smooth experience | Multiple fixes |
| Establish observability baseline | ❌ | Can't measure PMF yet | M1 priority |
| Measure funnel metrics | ❌ | Unknown activation/completion rates | M1 priority |

**Blockers:** No analytics → can't optimize funnel. **Must ship in M1.**

---

### Phase 3: Growth [PLANNED, M2–M3]
**Status:** 🟡 Planned (needs PMF validation first)

| Initiative | Priority | Timeline | Effort |
|-----------|----------|----------|--------|
| Expand job categories dynamically | P1 | M2 | M |
| Referral incentives | P2 | Q4 | M |
| SMS fallback | P3 | Q4 | M |
| Regional language support (Tamil/Telugu/Kannada) | P2 | Q1 2027 | L |
| Employer branding + company profiles | P2 | Q4 | M |

**Dependency:** Establish PMF in Phase 2 (must know if product resonates before scaling).

---

### Phase 4: Retention [PLANNED, M3–Q4]
**Status:** 🟡 Planned

| Initiative | Metric Impact | Timeline | Effort |
|-----------|----------------|----------|--------|
| Job match notifications (daily digest) | +5–10% D7 retention | M3 | M |
| Interview scheduling integration | +2–5% conversion | Q4 | L |
| Personalized job feed (ML ranking) | +3–7% conversion | Q1 2027 | L |
| Feedback response closure | +2–3% retention | Q4 | M |

---

### Phase 5: Monetization [PLANNED, Q4+]
**Status:** 🟡 Planned (PMF must be proven first)

| Initiative | Revenue Model | Timeline | Complexity |
|-----------|----------------|----------|-----------|
| Employer subscription (freemium → paid) | $50–200/month per employer | Q4 | M |
| Candidate premium features (TBD) | $2–5/month per user | Q1 2027 | M |
| Sponsored job placements | $100–500 per sponsored job | Q1 2027 | M |

**Risk:** Monetization is hypothetical. Validate PMF first. **Do not prioritize until M3.**

---

### Phase 6: Scale [PLANNED, Q4+]
**Status:** 🟡 Planned (critical for multi-employer SaaS)

| Initiative | Why Critical | Timeline | Effort |
|-----------|--------------|----------|--------|
| Persistent session state (Supabase) | Data loss on restart = churn | M1 (P0) | M |
| Multi-tenancy + auth (JWT + RLS) | Employer data isolation required | M2 (P0) | L |
| Observability (logging + monitoring) | Can't debug production | M1 (P0) | M |
| Rate limiting + abuse prevention | DDoS/spam risk | M2 (P1) | M |
| Database optimization (indexes, caching) | Latency increases with users | M3 (P1) | M |
| Audit logs + compliance (GDPR/data privacy) | Employer trust + legal risk | Q4 (P2) | M |

**Phase 6 is Foundational:** Must ship M1 P0 items before scaling to 2nd employer.

---

## 90-DAY EXECUTION PLAN

### Strategic Objectives
- **M1 (Weeks 1–4):** Fix critical production gaps; establish observability; validate PMF
- **M2 (Weeks 5–8):** Improve core funnel; ship auth + multi-tenancy; expand features
- **M3 (Weeks 9–12):** Improve retention; optimize performance; lock Q2 roadmap

### Month 1: Discovery + Foundational Fixes (Weeks 1–4)

**Goal:** Unblock production safety + enable data-driven decisions

#### Week 1–2: Migrate Session State to Supabase

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Design sessions table schema | TL | 4h | Schema doc |
| Implement Supabase session storage | BE | 20h | Code complete |
| Migrate existing in-memory sessions | BE | 15h | Data migration script |
| Add session persistence tests | BE | 5h | Test coverage |
| Deploy + monitor | BE + TL | 6h | Production verified |

**Rationale:** 🔴 **CRITICAL** — Every server restart loses user data. Unacceptable in production.  
**Success Metric:** 100% session persistence; zero data loss during restarts.

---

#### Week 2–3: Add Logging + Error Handling Framework

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Choose logging library (Winston/Pino) | TL | 2h | Framework decision |
| Implement logger module + middleware | BE | 15h | Logging pipeline |
| Add try-catch + error handlers to flows | BE | 15h | Error boundary coverage |
| Centralize error response format | BE | 5h | Consistent API responses |
| Test error scenarios | BE | 5h | Test coverage |

**Rationale:** 🔴 **CRITICAL** — Can't debug production issues without logs.  
**Success Metric:** All errors logged; production issues debuggable within 5 min.

---

#### Week 3–4: Build Analytics Event Tracking

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Design analytics schema (events table) | TL + Product | 4h | Schema + event taxonomy |
| Implement analytics service | BE | 15h | Event tracking library |
| Emit events at key user actions | BE | 20h | Coverage: flow start/end, question submit, error |
| Build basic analytics dashboard (Grafana/web) | FE | 12h | Funnel visibility |
| Deploy + validate data collection | BE + TL | 4h | Production monitoring |

**Rationale:** 🔴 **CRITICAL** — Can't measure PMF without data. Needed to prioritize all future work.  
**Success Metric:** Daily funnel visible (Acquisition → Activation → Application → Completion → Retention).

---

#### Week 4: Validation + Planning

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Analyze funnel data; write findings | Product + TL | 8h | PMF report |
| Identify top drop-off point | Product | 4h | Prioritized gap |
| Plan M2 based on data | Product + TL | 4h | M2 roadmap confirmed |

**Outcome:** Decision checkpoint — is PMF viable? Proceed to M2 or pivot?

---

### Month 2: Funnel Optimization + Core Infrastructure (Weeks 5–8)

**Goal:** Improve user journey; add multi-employer support; validate growth

#### Week 5–6: Implement Authentication + Multi-Tenancy

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Design auth architecture (JWT + Supabase RLS) | TL | 6h | Architecture doc |
| Implement JWT auth guards | BE | 20h | Auth middleware |
| Add Supabase RLS policies | BE | 15h | Row-level security |
| Implement employer login endpoint | BE | 10h | Login flow |
| Add tenant context middleware | BE | 10h | Tenant isolation |
| Test multi-tenant data isolation | BE | 5h | Security verification |

**Rationale:** 🔴 **CRITICAL** — B2B product with single-tenant DB = unacceptable.  
**Success Metric:** Employer A cannot see Employer B's data; login/logout works reliably.

---

#### Week 6–7: Config-Driven Job Categories

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Extend job categories config (Google Sheets) | Product | 2h | Config format defined |
| Update jobsSync to read dynamic roles | BE | 12h | Dynamic role loading |
| Update openai.service to use dynamic roles | BE | 8h | Role-specific questions adapt |
| Test with 5+ new roles | BE | 4h | Validation |

**Rationale:** Reduces code coupling; allows rapid iteration without deploys.  
**Success Metric:** Can add new job role via Google Sheet; questions dynamically generated.

---

#### Week 7–8: A/B Test Question Variants

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Design A/B test (variant prompt A vs B) | Product + TL | 4h | Test plan |
| Add variant tracking to analytics | BE | 8h | Event variant field |
| Implement variant assignment logic | BE | 8h | Random assignment per user |
| Monitor completion rate by variant | Product | 4h | Data collection |

**Rationale:** Validate if UX improvements (question wording) impact conversion.  
**Success Metric:** Can measure conversion rate lift; statistically significant by W8.

---

#### Week 8: Stabilization + Bug Fixes

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Triage + fix high-priority bugs | BE | 15h | Zero critical bugs |
| Performance profiling (identify slow queries) | BE + TL | 5h | Optimization roadmap |
| Code review + refactoring | TL | 5h | Code quality |

**Outcome:** Core funnel is stable; ready for retention work in M3.

---

### Month 3: Retention + Optimization + Planning (Weeks 9–12)

**Goal:** Improve user re-engagement; optimize performance; plan Q2

#### Week 9–10: Job Match Notifications

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Design notification schema | Product + TL | 4h | Notification types defined |
| Implement notifications service (job digest) | BE | 18h | Scheduled messaging |
| Build job matching algorithm (simple rules) | BE | 12h | Match logic |
| Send daily digest at 9 AM | BE | 6h | Cron trigger |
| Monitor delivery + click-through rate | Product | 4h | Analytics |

**Rationale:** Proactive re-engagement drives retention.  
**Success Metric:** Day 7 retention improves 5–10%; notification open rate > 30%.

---

#### Week 10–11: Performance Optimization

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Profile Supabase queries (slow job filtering) | BE + TL | 6h | Query analysis |
| Add database indexes (job_locations.city, .role) | BE | 8h | Index deployment |
| Optimize Google Sheets sync (batch reads) | BE | 10h | Reduced API calls |
| Load test with 1K concurrent users | BE | 4h | Latency baseline |
| Target: p95 latency < 2s | BE | 6h | Performance verified |

**Rationale:** Latency increases with scale; preemptive optimization required.  
**Success Metric:** Message send latency < 2s at 1K users; 99%+ success rate.

---

#### Week 11–12: Q2 Roadmap Planning

| Task | Owner | Effort | Outcome |
|------|-------|--------|---------|
| Aggregate M1–M3 metrics | Product + TL | 6h | PMF report |
| Analyze cohort retention / churn drivers | Product | 6h | Root cause analysis |
| Decide: Scale, Pivot, or Hold? | Founder + TL + Product | 4h | Strategic direction |
| Lock Q2 roadmap (hiring, features, budget) | All | 4h | Q2 plan committed |

**Outcome:** Clear strategic direction for next quarter; hiring/spend decisions locked.

---

### Capacity Utilization Summary

| Month | BE Total | FE Total | TL Total | Feasibility |
|-------|----------|----------|----------|-------------|
| **M1** | 2.5w | 0.5w | 1.5w | ✅ Realistic (P0 items clear) |
| **M2** | 2.5w | 0.5w | 1.5w | ⚠️ Tight (auth is heavy lift) |
| **M3** | 2w | 1w | 1.5w | ✅ Doable (load decreases) |
| **Total** | **7w** | **2w** | **4.5w** | ✅ Within capacity (90d sprint) |

**Risk Mitigation:**
- If M1 slips → extend to EOW3, delay M2 auth start to W6 instead of W5
- If auth overruns → cut optional M2 features (config-driven roles can wait)
- If analytics is slow → start with 5 critical events only; expand later

---

## METRICS & SUCCESS CRITERIA

### North Star Metric

**Successful Job Matches per Month** = (Applications Completed) × (Interview Booking Rate)

| Period | Target | How to Measure |
|--------|--------|-----------------|
| **Current (Baseline)** | [UNKNOWN] | Implement analytics in M1 |
| **EOQ3 (90d)** | 50–100 matches/month | Dashboard visible |
| **EOQ4 (6mo)** | 200–500 matches/month | 2–5x growth |

**Why This Metric?** Reflects core product value (connecting job seekers with opportunities). Grows with both acquisition and engagement. Directly tied to employer ROI.

---

### Funnel Metrics (90-Day Targets)

```
ACQUISITION (Week-over-week growth)
├─ New Users/Week: 50–100
└─ Target: 300–400 MAU by EOQ3

ACTIVATION (User completes language selection + main menu)
├─ Activation Rate: ≥80% (new users → language choice)
└─ Success Metric: Users reaching MAIN_MENU

CORE ACTION (User browses jobs + starts application)
├─ Job Browse Rate: ≥70% (users viewing ≥1 job)
├─ Application Start Rate: ≥50% (views → application start)
└─ Success Metric: Click-through from job list → application

VALUE DELIVERED (User completes application + receives recommendation)
├─ Application Completion Rate: ≥30%
├─ KYC Completion Rate: ≥60% (of job applications)
└─ Success Metric: Data export quality + volume

RETENTION (User returns within 7 days)
├─ Day 1 Retention: ≥50%
├─ Day 7 Retention: ≥25% (benchmark: ride-hailing 40%, food 30%)
├─ Day 30 Retention: ≥10%
└─ Success Metric: Re-engagement; repeat job browsing

MONETIZATION (Employer books interview or hires)
├─ Interview Booking Rate: ≥5% (of applications)
├─ Hire Rate: ≥1% (of applications) [industry benchmark: 2–3%]
└─ Success Metric: Employer value proof; can charge premium
```

---

### Guardrail Metrics (Warn if Breached)

| Metric | Alert Threshold | Owner | Action |
|--------|-----------------|-------|--------|
| **Message Delivery Success** | < 95% | BE | Investigate WhatsApp API errors |
| **Session State Loss** | > 5% | BE | Check Supabase + migration |
| **Error Rate (5xx responses)** | > 1% | BE | Debug & fix (production alert) |
| **p95 Message Latency** | > 3s | BE | Profile queries; optimize |
| **NPS Score** | < 30 | Product | Analyze feedback; identify issues |
| **Drop-off at Language Selection** | > 20% | Product | UX review required |
| **Drop-off at Job Browse** | > 30% | Product | Job data quality or relevance issue |
| **Drop-off at Application Completion** | > 70% | Product | Questions too hard or irrelevant |

---

### Success Criteria (End of 90 Days)

✅ **Technical:**
- 100% session persistence (no data loss on restart)
- < 1% error rate in production
- p95 latency < 2s
- 99%+ message delivery success
- Multi-tenant data isolation verified
- Logging + monitoring live

✅ **Product:**
- Funnel visible (Acquisition → Activation → Completion → Retention)
- Identified #1 drop-off point
- A/B test completed (1+ variant validated)
- NPS > 40 (or clear feedback on why lower)

✅ **Business:**
- 1,000 MAU (or understanding of why not)
- 50–100 successful job matches/month
- ≥2 employers active (demo + pilot)
- Path to $1K MRR identified

✅ **Team:**
- Q2 roadmap locked
- Hiring plan confirmed (scale or maintain)
- Engineering velocity baseline established

---

## MISSING PRODUCT CAPABILITIES

### Must-Have (Required for Scale)

| Capability | Why | Effort | Timeline |
|------------|-----|--------|----------|
| **Persistent Session State** | Server restarts = data loss; churn | M | M1 (P0) |
| **Multi-Tenancy + Auth** | Employer data isolation; trust | L | M2 (P0) |
| **Error Handling + Logging** | Can't debug production | M | M1 (P0) |
| **Analytics Framework** | Can't measure PMF | M | M1 (P0) |
| **Rate Limiting + Abuse Prevention** | DDoS/spam risk; scalability | M | M2 (P1) |
| **Email/Support Escalation** | Users need human support | M | Q4 (P2) |

### High-Value (Justified by User Problem)

| Capability | Why | Effort | Timeline |
|------------|-----|--------|----------|
| **Job Match Notifications** | Users forget jobs; drive retention | M | M3 (P1) |
| **Interview Scheduling** | Users matched but never hear back | L | Q4 (P1) |
| **Employer Dashboard** | HR reviews candidates; currently manual | L | Q4 (P1) |
| **Skill-Based Matching** | Role-based is crude; ML improves fit | L | Q1 2027 (P2) |
| **Candidate Profile** | No persistent profile; reset on restart | M | Q4 (P2) |
| **Audit Logs + Compliance** | GDPR, data privacy; EU expansion risk | M | Q4 (P2) |

### Nice-to-Have (Polish, not Core)

| Capability | Effort | Timeline |
|------------|--------|----------|
| **Referral Incentives** | M | Q4 (P3) |
| **Gamification** | M | Q1 2027 (P3) |
| **SMS Fallback** | M | Q1 2027 (P3) |
| **Multi-Language (South Indian)** | M | Q1 2027 (P3) |

### Avoid for Now

| Capability | Why | Opportunity Cost |
|------------|-----|------------------|
| **AI Resume Screening** | Complex; unproven ROI | HIGH |
| **Mobile App (iOS/Android)** | WhatsApp is mobile UX; marginal gain | VERY HIGH |
| **Video Interview** | Expensive infrastructure | HIGH |
| **Advanced BI/Reporting** | Analytics lite > full BI for MVP | MEDIUM |

---

## RISK ANALYSIS & MITIGATION

### Critical Risks

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|-----------|-----------|-------|
| **Session data lost on restart** | Users lose progress; immediate churn | 🔴 HIGH | Ship persistent DB in M1 W1–2 | BE |
| **No auth blocks 2nd customer** | Cannot scale to SaaS; PMF unproven | 🔴 HIGH | Lock auth in M2 W5–6 | BE + TL |
| **Poor funnel data hides problems** | Iterate blind; waste time | 🟠 MEDIUM | Ship analytics in M1 W3–4 | BE + Product |
| **Auth implementation overruns** | Cascades to M3 roadmap | 🟠 MEDIUM | Scope tightly (JWT only); use Supabase RLS | TL |
| **Job seeker CAC > $2** | Unit economics break; can't afford to grow | 🟠 MEDIUM | Validate referral/organic in M2 | Growth |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Team burnout (M2 tight)** | Quality drops; bugs increase | Hire contractor for M2 optimization work if needed |
| **Dependent on single BE** | Single point of failure | TL codes critical path items; cross-training |
| **Google Sheets API rate limits** | Sync/export fails at scale | Migrate to direct DB schema by Q4 |
| **WhatsApp API throttling** | Message delivery delays at 1K users | Test load limits; implement queue if needed |

---

## OPEN PRODUCT QUESTIONS

**Validated by End of Q3:**
1. Can we achieve 10%+ week-over-week growth via organic + referral?
2. What job categories drive 80% of volume? (Engineer vs. sales vs. support?)
3. Is KYC data quality acceptable to employers? Or need third-party verification?
4. What's employer willingness to pay? (Free vs. $50/mo vs. $200/mo?)

**Hypotheses to Test:**
1. Daily notifications increase Day 7 retention by 5%+ ✔️
2. Dynamic questions increase completion rate vs. static by 10%+ ✔️
3. Hindi-speaking users convert at same rate as English-speaking ⚠️ (TBD)
4. Job seekers prefer WhatsApp over web/mobile app for discovery ✔️ (assumed, not validated)

**Data Collection (M1):**
- Add user cohort tracking (acquisition date, language, region)
- Measure time-to-complete per question
- Track support tickets (pain points)
- NPS segmentation (high vs. low scorers)

---

## GLOSSARY

- **MAU:** Monthly Active Users (unique phone numbers with ≥1 interaction in 30 days)
- **PMF:** Product-Market Fit (confirmed demand + retention + willingness to pay)
- **D7 Retention:** % of users active on day 7 after signup
- **CAC:** Customer Acquisition Cost ($ spent / customers acquired)
- **NPS:** Net Promoter Score (-100 to +100; > 50 = healthy)
- **RLS:** Row-Level Security (Supabase fine-grained access control)
- **Cron:** Scheduled task (daily/weekly/monthly execution)
- **A/B Test:** Split test; measure variant impact on metric

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Aug 16, 2026 | PM | Initial comprehensive roadmap |

**Next Review:** Week 4 (M1 retrospective + data analysis)  
**Distribution:** Engineering team, founders, early advisor  
**Confidentiality:** Internal (do not share with customers yet)

---

*End of Roadmap Document*
