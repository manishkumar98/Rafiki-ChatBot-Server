# Rafiki ChatBot Server - Architecture Documentation

## Overview

Rafiki ChatBot Server is a NestJS-based WhatsApp chatbot platform designed to facilitate job matching, feedback collection, and customer support through conversational WhatsApp flows. The system integrates with multiple APIs including OpenAI, Google Sheets, Supabase, and WhatsApp Cloud API.

**Tech Stack:**
- Language: TypeScript (99.3%)
- Framework: NestJS 11.0
- Database: Supabase (PostgreSQL)
- Node Version: 22.10+

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WhatsApp User                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ WhatsApp    │
                    │ Cloud API   │
                    └──────┬──────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   ┌────▼───────────┐            ┌───────────▼────┐
   │ POST /webhook  │            │ Verify/Auth    │
   │ (incoming msgs)│            │ Endpoints      │
   └────┬───────────┘            └────────────────┘
        │
        ▼
   ┌─────────────────────────────────┐
   │  WhatsappController             │
   │ - Webhook validation            │
   │ - Message routing               │
   │ - Response formatting           │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │  FlowRouter Service             │
   │ - Route to active flow          │
   │ - Dispatch user input           │
   │ - Manage flow transitions       │
   └────────┬────────────────────────┘
            │
     ┌──────┼──────┬─────────┐
     │      │      │         │
     ▼      ▼      ▼         ▼
  ┌────┐ ┌────┐ ┌────┐  ┌────────┐
  │Job │ │Feed│ │Supp│  │Accomm. │
  │Flow│ │Flow│ │Flow│  │Flow(WIP)
  └─┬──┘ └─┬──┘ └─┬──┘  └────────┘
    │      │     │
    └──────┼─────┘
           │
     ┌─────▼──────────────────┐
     │  Service Layer         │
     │ - JobService           │
     │ - OpenAiService        │
     │ - SheetsService        │
     │ - StateService         │
     │ - SessionService       │
     └─────┬──────────────────┘
           │
     ┌─────┴─────────────────────┬──────────────┐
     │                           │              │
     ▼                           ▼              ▼
 ┌────────────┐  ┌──────────────────┐  ┌────────────────┐
 │ Supabase   │  │ Google Sheets    │  │ OpenAI GPT-4o  │
 │ PostgreSQL │  │ + Drive APIs     │  │ (LLM)          │
 │ Real-time  │  │ (Data Storage)   │  │                │
 │ Storage    │  │                  │  │ Question Gen   │
 └────────────┘  └──────────────────┘  └────────────────┘
```

---

## Module Structure

### 1. **WhatsApp Module** (`src/whatsapp/`)
Handles all WhatsApp Cloud API integrations and incoming message processing.

```
whatsapp/
├── whatsapp.controller.ts       # HTTP webhook endpoint for incoming messages
├── whatsapp.module.ts           # NestJS module definition
├── job.service.ts               # Job search, filtering, and messaging logic
├── openai.service.ts            # OpenAI integration for LLM calls
├── nps.service.ts               # NPS (Net Promoter Score) batch trigger
└── constants.ts                 # WhatsApp message templates & configurations
```

**Key Responsibilities:**
- POST `/webhook`: Receive and validate incoming WhatsApp messages
- Send formatted messages via WhatsApp Graph API
- Handle message replies with quick reply buttons
- Trigger NPS surveys via scheduled jobs

**Dependencies:**
- OpenAI API for conversational responses
- WhatsApp Cloud API (meta/graph)
- Supabase for job data queries

---

### 2. **Flows Module** (`src/flows/`)
Orchestrates multi-step conversational flows through the chatbot.

```
flows/
├── flow.interface.ts            # FlowHandler interface contract
├── flow-router.service.ts       # Main dispatcher for flow routing
├── job/
│   ├── job.flow.ts              # Job discovery & matching flow
│   └── job.module.ts
├── feedback/
│   ├── feedback.flow.ts         # NPS/feedback collection flow
│   └── feedback.module.ts
├── support/
│   ├── support.flow.ts          # Customer support query flow
│   └── support.module.ts
└── accommodation/               # Accommodation booking flow (WIP)
    ├── accommodation.flow.ts
    └── accommodation.module.ts
```

**FlowHandler Contract:**
```typescript
interface FlowHandler {
  canHandle(flow: string): boolean;
  handle(from: string, text: string, state: any): Promise<string | void>;
}
```

**Flow Lifecycle:**
1. User message arrives → FlowRouter.route()
2. Router identifies current flow from session state
3. Appropriate flow handler processes input
4. State updated with new flow/step
5. Response sent to user via JobService

---

### 3. **Session Management Module** (`src/session/`)
Manages conversation state and session persistence.

```
session/
├── conversation-state.service.ts # In-memory state tracking
├── session.service.ts           # Session persistence to DB
└── session.module.ts
```

**State Object Structure:**
```typescript
{
  phone: string;
  language: "EN" | "HI";
  currentFlow: "LANGUAGE" | "MAIN_MENU" | "JOB" | "FEEDBACK" | "SUPPORT" | "ACCOMMODATION";
  step: number;
  substep?: number;
  data: {
    city?: string;
    area?: string[];
    role?: string;
    jobRecords?: Job[];
    answers?: Record<string, any>;
    [key: string]: any;
  };
}
```

---

### 4. **Google Sheets Integration** (`src/sheets/`)
Persists session data and collects user responses in Google Sheets.

```
sheets/
├── sheets.service.ts            # Google Sheets API wrapper
└── sheets.module.ts
```

**Key Methods:**
- `appendRow(session, phone)`: Append user session/response
- Dynamic header management (auto-add new fields)
- Batch job record formatting (jobs shown as multi-line entries)
- Timestamp tracking for all submissions

**Google Credentials:**
- Loaded from `GOOGLE_SERVICE_JSON` env variable (base64)
- Cached at `/tmp/google-credentials.json`
- Scopes: `spreadsheets`

---

### 5. **Shared Module** (`src/shared/`)
Provides injectable singletons for external services.

```
shared/
└── supabase.module.ts           # Supabase client provider
```

---

### 6. **Constants Module** (`src/constants/`)
Centralized configuration and messaging templates.

```
constants/
├── constants.ts                 # Role definitions, job categories
├── nps_constants.ts             # NPS feedback questions (multilingual)
└── onboarding_constants.ts      # Onboarding flow questions
```

---

### 7. **Jobs Export Module** (`src/jobs-export/`)
Scheduled job syncing from upstream source to Supabase.

```
jobs-export/
├── jobs-export.service.ts       # Job data sync & transformation
├── jobs-export.controller.ts    # Manual trigger endpoints
└── jobs-export.module.ts
```

---

### 8. **Jobs Sync Module** (`src/jobs-sync/`)
Real-time job database synchronization.

```
jobs-sync/
├── jobs-sync.service.ts         # Scheduled sync job runner
└── jobs-sync.module.ts
```

---

## Core Data Flows

### Job Discovery Flow
```
User: "Show me job opportunities"
         │
         ▼
FlowRouter → JobFlow
         │
         ├─→ Select Language (EN/HI)
         ├─→ Select City
         ├─→ Select Area(s)
         ├─→ Select Job Role
         │   │
         │   └─→ OpenAiService.generateQuestionsForRole()
         │       (GPT-4o-mini generates role-specific questions)
         │
         ├─→ Answer Role Questions (multi-turn)
         │
         ├─→ Validate Answers (OpenAI)
         │
         ├─→ JobService.findJobsByCity()
         │   (Supabase RPC call)
         │
         ├─→ Filter Jobs by:
         │   - City
         │   - Area
         │   - Role
         │   - Candidate Criteria
         │
         ├─→ Send Matching Jobs (WhatsApp)
         │
         ├─→ User Selects Job
         │
         ├─→ KYC Document Upload Flow
         │   └─→ Store in Supabase Storage
         │
         ├─→ Append Session to Google Sheets
         │
         └─→ Confirmation & Reset
```

### Feedback Collection Flow
```
Admin Trigger: NPS batch job scheduled
         │
         ▼
NpsService.triggerNps()
         │
         ├─→ Query eligible users (Supabase)
         ├─→ For each user:
         │   │
         │   ├─→ Send language prompt
         │   ├─→ Multi-step NPS questions
         │   │   (Nest rating → Nest remarks → Curry rating → Job rating → Overall NPS)
         │   │
         │   ├─→ Validate numeric responses
         │   ├─→ Append to Google Sheets
         │   └─→ Thank you message
         │
         └─→ Update session state
```

### Support Flow
```
User: "I have a problem..."
         │
         ▼
FlowRouter → SupportFlow
         │
         ├─→ Receive support query text
         ├─→ Append to Google Sheets ("Support Queries")
         ├─→ Send thank you message
         └─→ Auto-reset to Main Menu
```

---

## API Integrations

### WhatsApp Cloud API
**Endpoint:** `https://graph.instagram.com/v18.0/`
**Authentication:** Bearer Token (env: `WHATSAPP_TOKEN`)
**Message Types:**
- Text messages
- Interactive messages (quick reply buttons)
- Media messages (images, documents)
- Document uploads for KYC

### OpenAI API
**Model:** `gpt-4o-mini`
**Use Cases:**
1. Generate role-specific questions (dynamic, based on role)
2. Validate user answers (check relevance & correctness)
3. Generate follow-up prompts
**Rate Limiting:** Configurable per env

### Google Sheets API
**Scopes:** `https://www.googleapis.com/auth/spreadsheets`
**Sheets Used:**
- `Sheet1`: Main user responses
- `Support Queries`: Support submissions
- `NPS Feedback`: Feedback responses
**Operations:**
- Append rows (batch)
- Read headers (for dynamic column management)
- Auto-add columns for new fields

### Google Drive API
**Purpose:** Store service account credentials securely
**Scope:** `https://www.googleapis.com/auth/drive`

### Supabase
**Features Used:**
- PostgreSQL tables (jobs, users, sessions)
- Real-time subscriptions
- RPC functions for complex queries
- Storage buckets for KYC documents
- Authentication (optional JWT)

---

## Environment Configuration

```env
# WhatsApp
WHATSAPP_TOKEN=<bearer-token>
WHATSAPP_PHONE_ID=<phone-number-id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<biz-account-id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<webhook-verify-token>

# OpenAI
OPENAI_API_KEY=<api-key>

# Google
GOOGLE_SERVICE_JSON=<base64-encoded-service-account-json>
SPREADSHEET_ID=<google-sheet-id>

# Supabase
SUPABASE_URL=<supabase-project-url>
SUPABASE_KEY=<supabase-api-key>

# Server
PORT=3000
NODE_ENV=development|production
```

---

## State Management

### Conversation State
- Stored in-memory during active session
- Synced to Supabase on key milestones
- Session timeout: 24 hours (configurable)

### State Transitions
```
User connects
  │
  ├─→ LANGUAGE (select EN/HI)
  │
  ├─→ MAIN_MENU (job/support/feedback)
  │
  ├─→ [JOB | FEEDBACK | SUPPORT]
  │   │
  │   ├─→ Multi-step flow
  │   └─→ Validation & persistence
  │
  └─→ RESET → back to MAIN_MENU
```

---

## Error Handling

**Strategy:**
- Graceful degradation for external API failures
- User-friendly error messages (multilingual)
- Error logging to Supabase
- Webhook retry mechanism (WhatsApp automatic)

**Error Types:**
1. **API Errors:** OpenAI timeout, WhatsApp rate limit
   - Retry with exponential backoff
   - Fallback to pre-canned responses
   
2. **Validation Errors:** Invalid input, missing required fields
   - Re-prompt user with clarification
   - Log for debugging

3. **Database Errors:** Supabase connection loss
   - Queue messages locally
   - Sync on reconnection

---

## Scalability & Performance

### Current Bottlenecks
1. **In-memory session state** → Needs Redis for distributed systems
2. **Google Sheets append** → Rate limited at 100 req/min
3. **OpenAI API calls** → ~4 calls per job flow

### Optimization Opportunities
1. **Session Store:** Migrate to Redis (supports multiple instances)
2. **Batch Writes:** Queue sheet writes, flush every 10s
3. **LLM Caching:** Cache frequently asked questions
4. **Message Batching:** Send multiple messages in single API call

---

## Testing Strategy

```
tests/
├── unit/                        # Service-level tests
├── e2e/                         # Flow integration tests
├── mocks/
│   ├── whatsapp.mock.ts         # Mock WhatsApp API responses
│   ├── openai.mock.ts           # Mock LLM responses
│   └── sheets.mock.ts           # Mock Google Sheets
└── fixtures/                    # Sample test data
```

**Test Commands:**
```bash
npm test                          # Unit tests
npm run test:watch               # Watch mode
npm run test:cov                 # Coverage report
npm run test:e2e                 # End-to-end tests
```

---

## Deployment

### Build & Release
```bash
npm run build                     # Compile TypeScript → dist/
npm start                         # Run production binary
npm run start:dev                 # Watch mode (development)
```

### Docker (Recommended)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific
- **Development:** `start:dev` with hot-reload
- **Staging:** Full GCP/AWS managed services
- **Production:** Kubernetes or serverless (Cloud Run)

---

## Future Enhancements

1. **Accommodation Flow:** Complete WIP flow for housing/lodging
2. **Redis Session Store:** Scale to multiple server instances
3. **Webhooks:** Allow 3rd-party integrations (Zapier, Make)
4. **Admin Dashboard:** Real-time analytics & user management
5. **Multi-language Support:** Expand beyond EN/HI
6. **ML Ranking:** Replace rule-based job filtering with ML ranking
7. **Video Calls:** In-app video interview scheduling

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not receiving messages | Invalid verify token | Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` env var |
| OpenAI timeout | Rate limit exceeded | Implement retry logic with exponential backoff |
| Google Sheets errors | Service account expired | Regenerate `GOOGLE_SERVICE_JSON` |
| Session state lost | In-memory cleared on restart | Implement persistent session store (Redis) |
| Message not delivered | Phone number not WhatsApp enabled | Ensure number in `WHATSAPP_PHONE_ID` is WhatsApp-enabled |

---

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
