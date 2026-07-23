# Rafiki ChatBot - Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** Active Development  

---

## 1. Executive Summary

**Rafiki** is a WhatsApp-based intelligent chatbot platform that connects job seekers with employment opportunities while collecting user feedback and managing the complete job discovery and onboarding workflow. The platform leverages conversational AI, real-time job matching, and structured data collection to streamline employment in emerging markets.

**Primary Use Case:** Multi-language job discovery, role-specific qualification assessment, KYC (Know Your Customer) verification, and user feedback collection via WhatsApp.

**Target Users:**
- Job seekers (18–70 years old) in India looking for employment
- Organizations using Rafiki to distribute jobs and collect employee feedback
- Platform administrators managing job inventory and user data

---

## 2. Product Vision & Goals

### Vision
To democratize job access by making employment discovery conversational, accessible, and mobile-first through WhatsApp—the most trusted communication channel in emerging markets.

### Goals
1. **Job Discovery:** Enable users to discover 5–50 relevant jobs per search query via city and role filtering
2. **User Qualification:** Validate candidate qualifications in real-time using role-specific criteria
3. **Data Capture:** Collect verified user profiles and KYC documents for compliance and recruitment
4. **Feedback Loop:** Gather NPS and experience feedback to improve service quality
5. **Accessibility:** Support bilingual conversations (English & Hindi) with conversational, natural responses
6. **Scalability:** Handle thousands of concurrent conversations with stateful session management

---

## 3. Core Features

### 3.1 Multi-Language Onboarding
**Description:** Users select their preferred language (English or Hindi) and proceed through a structured workflow.

**Flows:**
- Language selection (English/हिंदी)
- Multi-phase conversation state management
- Automatic fallback and retry logic for invalid inputs

**Technical Details:**
- Supported languages: `EN`, `HI`
- State persistence across sessions using `ConversationStateService`
- All UI strings support bilingual variants

---

### 3.2 Job Discovery & Recommendation Engine

#### 3.2.1 Multi-Phase Search Funnel
Users discover jobs through a 5-step filtering process:

**Phase 1: Profile Collection (COMMON)**
- Collect: Full name, age, residence city, job preference city
- Validation: OpenAI-powered validation for names, ages (18–70), and city normalization
- Duration: ~3–4 minutes

**Phase 2: Role Selection (ROLE)**
- Search jobs by city using `search_active_jobs` Supabase RPC
- Extract unique job roles from results
- Present up to 10 roles with emoji icons and descriptions
- User selects preferred role

**Phase 3: Role-Specific Assessment (ROLE)**
- Ask role-specific questions (e.g., "Do you have a driving license?" for Delivery Executive)
- Each role has 2–7 qualification questions
- Yes/No or text-based responses
- Questions are dynamically generated using GPT-4o-mini for natural phrasing

**Phase 4: Job Listing & Selection (JOB_SELECTION)**
- Filter all available jobs in the selected role
- Present jobs with company, salary, location, locality
- User selects a job or chooses "Not Interested"
- If interested → proceed to KYC
- If not interested → show retry/back/exit options

**Phase 5: KYC Document Collection (KYC)**
- Collect 4 mandatory documents:
  - Aadhaar Front (image)
  - Aadhaar Back (image)
  - PAN Card (image)
  - Bank Proof (Passbook/Cancelled Cheque)
- Upload to Supabase storage and save URLs

#### 3.2.2 Job Data Model
```typescript
{
  role: string;        // "Delivery Executive", "Driver", etc.
  client: string;      // Company name
  city: string;        // "Bengaluru", "Mumbai", etc.
  state: string;       // State abbreviation
  locality: string;    // Specific area/locality
  salary: string;      // "CTC 30000", "Inhand 25000"
}
```

#### 3.2.3 Role-Specific Qualifications
Each role has a predefined set of qualification questions, e.g.:
- **Delivery Executive:** MCWG License, Driving License, Bike Owner
- **Driver:** 3+ years license
- **Picker/Packer:** Can read English
- **Supervisor:** 3+ years eCommerce experience, Excel skills, 12th pass

Age restrictions apply to some roles (e.g., Picker/Packer: 18–35 years).

---

### 3.3 AI-Powered Natural Language Processing

#### 3.3.1 Question Generation
- **Service:** `OpenAiService.generateQuestion()`
- **Model:** GPT-4o-mini
- **Input:** Question key, role, language, user context
- **Output:** Natural, conversational rephrasing of template questions
- **Example:**
  ```
  Template: "Do you have a driving licence? ☺️ | Got your driving licence with you? 📃"
  Generated: "Hi Raj, do you have a valid driving license? 🙂"
  ```

#### 3.3.2 Answer Validation
- **Service:** `OpenAiService.validateAnswer()`
- **Approach:** 
  - Hardcoded validation for age (must be 18–70)
  - GPT-4o-mini for city normalization and flexibility
  - Examples: "Bangalor" → "Bengaluru", "Hyd" → "Hyderabad"
- **Output:** `{ isValid: boolean; value: string }`

---

### 3.4 Feedback & NPS Collection

#### 3.4.1 Feedback Flow
Users can provide feedback on:
- Accommodation experiences (Nest ratings, food service)
- Job placement outcomes
- Overall service quality (0–10 scale)

#### 3.4.2 Conditional Question Logic
Questions include conditional branches:
```typescript
{
  key: "curryUser",
  type: "boolean",
  prompt: { EN: "Do you use Curry (food)?", HI: "क्या आप खाना सेवा लेते हो?" },
  when: { if: "nestStay", equals: true } // Only ask if nestStay === true
}
```

#### 3.4.3 Data Persistence
- All feedback saved to Google Sheets (`Feedback` sheet)
- Support queries saved to `SupportQueries` sheet
- Timestamps and phone numbers auto-added

---

### 3.5 KYC & Document Management

#### 3.5.1 Document Collection Flow
```
Step 1 → Ask if documents ready (Yes/No/Exit)
Step 2 → Upload Aadhaar Front
Step 3 → Upload Aadhaar Back
Step 4 → Upload PAN Card
Step 5 → Upload Bank Proof
Done → Save all documents, reset conversation
```

#### 3.5.2 Media Upload & Storage
- **Service:** `JobService.handleMediaUpload()`
- **Flow:**
  1. Receive WhatsApp media ID
  2. Fetch media URL via WhatsApp Graph API
  3. Download file binary
  4. Upload to Supabase storage (`kyc-docs` bucket)
  5. Generate public URL and save to database
- **Storage Path:** `kyc/{mediaId}.jpg`

#### 3.5.3 Data Schema
```typescript
KYC Record {
  phone: string;
  timestamp: string;
  aadhar_front: string;    // URL
  aadhar_back: string;     // URL
  pan_card: string;        // URL
  bank_proof: string;      // URL
  rafiki_source: string;   // "Instagram/Facebook" | "Friend" | "Employee"
}
```

---

### 3.6 Whatsapp Integration

#### 3.6.1 Webhook Endpoint
- **Endpoint:** `POST /webhook`
- **Verification:** GET request with `hub.challenge` token
- **Message Processing:**
  - Text messages
  - Interactive button/list replies
  - Media uploads (image, document, video, audio)

#### 3.6.2 Interactive Messages (Buttons)
- Max 3 buttons per message
- If fewer than 3 buttons provided, auto-add "Reset" button
- Button format:
  ```typescript
  {
    type: "reply",
    reply: {
      id: string;      // Button ID returned to webhook
      title: string;   // Display text (max 20 chars)
    }
  }
  ```

#### 3.6.3 Message Sending
- **Service:** `JobService.sendWhatsAppMessage()`
- **API:** Facebook Graph API v19.0
- **Payload Types:**
  - Text-only messages
  - Interactive buttons
  - Button groups (chunked at 3 buttons per message)

#### 3.6.4 Special Triggers
| Trigger | Action |
|---------|--------|
| `"hi"`, `"hello"`, `"start"` | Restart conversation from language selection |
| `"r"` (reset) | Reset state and restart, with exceptions for Feedback flow |
| NPS webhook body | Trigger feedback flow directly |

---

### 3.7 Session & State Management

#### 3.7.1 Conversation State
- **Service:** `ConversationStateService`
- **Scope:** Per-user (phone number)
- **Fields:**
  ```typescript
  {
    currentFlow: "LANGUAGE" | "JOB" | "FEEDBACK" | "ACCOMMODATION";
    language: "EN" | "HI";
    step: number;
    job: { phase: JobPhase };
    answers: Record<string, any>;
    available_jobs: Job[];
    selectedRole: string;
    nps_feedback_answers: Record<string, any>;
  }
  ```

#### 3.7.2 Flow Router
- **Service:** `FlowRouter`
- Routes messages to correct flow handler based on `currentFlow`
- Maintains separation of concerns: Job flow, Feedback flow, Support flow

---

### 3.8 Data Persistence (Google Sheets)

#### 3.8.1 Sheet Structure
| Sheet Name | Purpose | Key Columns |
|------------|---------|------------|
| `Sheet1` | Job inquiry leads | full_name, phone, age, residence_city, job_preference_city, selectedJob, status, answers.*, timestamp |
| `Leads` | Initial lead capture | phone, full_name, timestamp |
| `Feedback` | User feedback & NPS | phone, *feedback_answers, timestamp |
| `KYC` | KYC documents | phone, aadhar_front, aadhar_back, pan_card, bank_proof, timestamp |
| `SupportQueries` | Support requests | phone, query, timestamp |
| `NPS` | User list for NPS outreach | phone, type |

#### 3.8.2 Data Flow
```
WhatsApp Message → Conversation State → User Answers → Google Sheets append
```

---

## 4. User Flows & Journeys

### 4.1 Happy Path: Job Discovery & Application
```
1. User sends "hi" or "hello"
   ↓
2. Select language (EN/HI)
   ↓
3. Answer profile questions (name, age, cities) [3–4 min]
   ↓
4. Search jobs by city
   ↓
5. Select preferred role [2–3 min]
   ↓
6. Answer role-specific questions [1–3 min]
   ↓
7. View matching jobs in selected role
   ↓
8. Select a job (or retry/exit)
   ↓
9. Upload 4 KYC documents [2–5 min]
   ↓
10. Confirmation message & auto-reset

Total time: 8–15 minutes
```

### 4.2 Feedback Collection Flow
```
1. Admin/system triggers NPS via webhook
   ↓
2. User receives NPS message
   ↓
3. Select language
   ↓
4. Answer conditional feedback questions (1–10 questions depending on branches)
   ↓
5. Thank you & reset

Total time: 3–7 minutes
```

### 4.3 Support Flow
```
1. User types "support" or error occurs
   ↓
2. User enters support query (text)
   ↓
3. Query saved to sheets
   ↓
4. Thank you message

Total time: <1 minute
```

---

## 5. Technical Architecture

### 5.1 Tech Stack
- **Language:** TypeScript (99.3% of codebase)
- **Framework:** NestJS 11 (Node.js)
- **Database:** Supabase (PostgreSQL + Real-time)
- **External APIs:**
  - OpenAI GPT-4o-mini (question generation, answer validation)
  - WhatsApp Cloud API (message sending, webhook)
  - Google Sheets API (data persistence)
  - Google Drive API (credential management)
- **Storage:** Supabase Storage (KYC documents)

### 5.2 Core Modules
```
src/
  ├── whatsapp/
  │   ├── whatsapp.controller.ts       # Webhook endpoint
  │   ├── job.service.ts               # Job search & messaging
  │   ├── openai.service.ts            # LLM integration
  │   └── nps.service.ts               # NPS batch trigger
  ├── flows/
  │   ├── job/job.flow.ts              # Job discovery flow
  │   ├── feedback/feedback.flow.ts    # Feedback collection
  │   ├── support/support.flow.ts      # Support queries
  │   ├── accommodation/              # Accommodation flow (WIP)
  │   └── flow-router.service.ts       # Flow dispatch
  ├── session/
  │   ├── conversation-state.service.ts # State management
  │   └── session.service.ts           # Session persistence
  ├── sheets/
  │   └── sheets.service.ts            # Google Sheets integration
  ├── constants/
  │   ├── constants.ts                 # Role definitions, messages
  │   └── feedback.constants.ts        # Feedback questions
  └── shared/
      └── supabase.module.ts           # DB client injection
```

### 5.3 Data Flow Diagram
```
User (WhatsApp)
    ↓
WhatsApp Cloud API
    ↓
/webhook endpoint (WhatsappController)
    ↓
FlowRouter (selects flow)
    ↓
[JobFlow | FeedbackFlow | SupportFlow]
    ↓
OpenAiService (LLM calls)
    ↓
JobService.findJobsByCity() (Supabase RPC)
    ↓
JobService.sendWhatsAppMessage() (WhatsApp Graph API)
    ↓
SheetsService (Google Sheets append)
    └→ ConversationStateService (session store)
```

---

## 6. API Contracts & Integrations

### 6.1 WhatsApp Webhook Payload

**Incoming Message Example:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "type": "text",
                "text": { "body": "Delivery Executive" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Interactive Button Reply Example:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": { "id": "1", "title": "Delivery Executive" }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### 6.2 Supabase RPC Functions

**`search_active_jobs(city_input: text)`**
- Input: City name (normalized)
- Output: Jobs array matching city, filtered to active status
- Used by: `JobService.findJobsByCity()`

**`fuzzy_find_jobs(city_input: text, state_input: text)`**
- Input: City, State (with typo tolerance)
- Output: Fuzzy-matched jobs
- Used by: `JobService.findJobs()` (deprecated)

### 6.3 OpenAI API Calls

**Generate Question (GPT-4o-mini):**
```
Input: {"question_template": "...", "role": "...", "language": "EN", "context": {...}}
Output: "Hi Raj, do you have a valid driving license? 🙂"
```

**Validate Answer:**
```
Input: {"key": "job_preference_city", "answer": "Bangalor"}
Output: "VALID:Bengaluru"
```

### 6.4 Google Sheets API

**Append Row:**
```
POST /sheets:append
- spreadsheetId: env.SPREADSHEET_ID
- range: "Sheet1!A1"
- values: [[header_row], [data_row]]
```

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **Message latency:** <2 seconds end-to-end
- **Concurrent users:** 1,000+ concurrent conversations
- **Throughput:** 100+ messages/second
- **Database:** Supabase real-time with connection pooling

### 7.2 Reliability
- **Uptime:** 99.5% monthly availability
- **Error recovery:** Automatic state reload on webhook retry
- **Message idempotency:** Phone number + timestamp as key

### 7.3 Scalability
- **Stateless API:** Scale horizontally with load balancer
- **Session store:** Supabase for distributed state
- **Database:** Auto-scaling PostgreSQL

### 7.4 Security
- **Authentication:** WhatsApp token validation on webhook
- **Data encryption:** TLS 1.2+ in transit, Supabase encryption at rest
- **PII handling:** KYC documents in private Supabase storage bucket
- **Input validation:** All user inputs validated via OpenAI or hardcoded rules
- **API secrets:** Injected via environment variables

### 7.5 Compliance
- **Data retention:** Google Sheets archive (user-configurable)
- **GDPR:** Phone number = PII identifier; support user data export on request
- **KYC:** Document storage in isolated bucket; access logs maintained

---

## 8. Configuration & Environment

### 8.1 Required Environment Variables
```bash
# WhatsApp API
WHATSAPP_TOKEN=<graph_api_token>
WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>
WEBHOOK_VERIFY_TOKEN=<random_token>

# OpenAI
OPENAI_API_KEY=<api_key>

# Supabase
SUPABASE_URL=<project_url>
SUPABASE_KEY=<anon_key>

# Google Sheets
SPREADSHEET_ID=<sheet_id>
GOOGLE_SERVICE_JSON=<base64_encoded_credentials>

# App
PORT=3000
NODE_ENV=production
```

### 8.2 Sheet Setup
Must create the following sheets in the target Google Sheet:
1. `Sheet1` – Job inquiries
2. `Leads` – Initial leads
3. `Feedback` – Feedback responses
4. `KYC` – KYC documents
5. `SupportQueries` – Support requests
6. `NPS` – Phone numbers for NPS triggers

---

## 9. Testing & QA

### 9.1 Unit Tests
- OpenAI service mock tests
- State management edge cases
- Role-specific question filtering
- Input validation logic

### 9.2 Integration Tests
- End-to-end job discovery flow
- Feedback collection branches
- Google Sheets append operations
- WhatsApp webhook parsing

### 9.3 Manual Testing Scenarios
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Language selection | Send "hi" → Select English | Job flow starts |
| Invalid age | Answer age as "5" | Error message, retry prompt |
| City fuzzy match | Answer city as "Bangalor" | Normalized to "Bengaluru" |
| Job selection | Select job #1 | KYC flow begins |
| Document retry | Send text instead of image | Error, re-request media |
| NPS trigger | POST `/webhook/trigger-nps` | Feedback flow initiated |

---

## 10. Roadmap & Future Features

### Phase 2 (Q2 2025)
- [ ] Accommodation platform integration (currently WIP)
- [ ] Video screening for candidates
- [ ] Job recommendations based on profile
- [ ] Employer dashboard for job posting & applicant review

### Phase 3 (Q3 2025)
- [ ] SMS fallback for non-WhatsApp users
- [ ] Voice-based job discovery (audio input)
- [ ] Payment integration for premium features
- [ ] Analytics dashboard (user funnel, conversion rates)

### Phase 4 (Q4 2025)
- [ ] Multi-language expansion (Regional languages)
- [ ] Chatbot training on domain-specific QA
- [ ] Integration with ATS (Applicant Tracking System)
- [ ] ML-based job matching (beyond keyword search)

---

## 11. Success Metrics

### Engagement
- **Daily Active Users (DAU):** Target 10,000+
- **Conversation completion rate:** >70%
- **Average session duration:** 8–15 minutes

### Conversion
- **Job discovery success rate:** >60% (user finds relevant jobs)
- **KYC completion rate:** >80% (users complete document upload)
- **Feedback response rate:** >50% (for NPS surveys)

### Operational
- **Message delivery rate:** >99%
- **API response time (p95):** <1 second
- **Error rate:** <0.5%

---

## 12. Appendix

### A. Glossary
| Term | Definition |
|------|-----------|
| **KYC** | Know Your Customer – Identity verification process |
| **NPS** | Net Promoter Score – Customer satisfaction feedback |
| **RPC** | Remote Procedure Call – Supabase PostgreSQL function |
| **Flow** | Conversation workflow (Job, Feedback, Support) |
| **Phase** | Substage within a flow (COMMON, ROLE, JOB_SELECTION) |
| **CTC** | Cost To Company – Total salary including benefits |

### B. Code Examples

#### B.1 Starting a Job Discovery Conversation
```typescript
// Called when user sends "hi"
const lang: Lang = "EN";
const flow = new JobFlow(stateService, jobsService, openAiService, sheetsService);
await flow.start(phoneNumber, lang);

// Output: "What is your name?" via WhatsApp
```

#### B.2 Searching Jobs
```typescript
const jobs = await jobsService.findJobsByCity("Bengaluru");
// Returns: [{ role: "Delivery Executive", client: "Flipkart", salary: "CTC 30000", ... }, ...]

const uniqueRoles = [...new Set(jobs.map(j => j.role))];
// ["Delivery Executive", "Driver", "Picker/Packer", ...]
```

#### B.3 Collecting Feedback
```typescript
const feedbackFlow = new FeedbackFlow(stateService, jobsService, sheetsService);
const response = await feedbackFlow.handle(phoneNumber, "5", feedbackState);
// Saves rating, asks next question, or completes feedback
```

---

## 13. Approval & Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | — | — | — |
| Engineering Lead | — | — | — |
| Design Lead | — | — | — |

---

**Document Status:** Draft / In Review / Approved ✅  
**Last Updated:** January 2025  
**Next Review Date:** April 2025
