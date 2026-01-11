# 🏗️ Architecture Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  About   │  │  Finder  │  │   Mail   │  │   Chat   │       │
│  │   Me     │  │ (Projects)│  │ (Contact)│  │   (AI)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       CUSTOM HOOKS LAYER                        │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ useWindowManager │  │ useMailComposer│ │   useChat      │  │
│  │  (State Logic)   │  │  (Form Logic) │  │ (Chat Logic)   │  │
│  └──────────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  API Client  │  │ Mail Service │  │   Chat Service     │   │
│  │ (HTTP Logic) │  │ (Email API)  │  │  (Gemini API)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                             │
│  ┌─────────────────────────┐  ┌──────────────────────────┐    │
│  │  Contact API Endpoint   │  │   Google Gemini API      │    │
│  │  /api/contact           │  │   (External Service)     │    │
│  │  ┌─────────────────┐    │  └──────────────────────────┘    │
│  │  │  Resend/SendGrid│    │                                   │
│  │  │  (Email Delivery)│   │                                   │
│  │  └─────────────────┘    │                                   │
│  └─────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Sending an Email

```
User fills form → useMailComposer hook → mailService.sendContactEmail()
                        ↓                        ↓
                  Validates form         Calls apiClient.post()
                        ↓                        ↓
                  Updates state          HTTP POST /api/contact
                        ↓                        ↓
                  Shows loading          Backend validates request
                        ↓                        ↓
                  Waits for API          Sends email via Resend
                        ↓                        ↓
                  Receives response      Returns {success: true}
                        ↓                        ↓
                  Shows success ✅       Email delivered 📧
```

---

## Data Flow: AI Chat Message

```
User types message → useChat hook → chatService.sendMessage()
                         ↓                      ↓
                   Adds to messages     Calls Gemini API
                         ↓                      ↓
                   Shows typing         AI processes with tools
                         ↓                      ↓
                   Saves to localStorage  Returns response
                         ↓                      ↓
                   Displays response    May execute tool calls
                         ↓                      ↓
                   Auto-scrolls         Updates conversation
```

---

## Folder Structure Tree

```
pod/
│
├── 📄 Documentation
│   ├── GUIDE_INDEX.md           ← Start here!
│   ├── QUICK_START.md           ← Setup in 5 min
│   ├── REFACTORING_SUMMARY.md   ← What changed
│   ├── ARCHITECTURE.md          ← Deep dive
│   ├── BACKEND_GUIDE.md         ← Backend setup
│   └── .env.example             ← Template
│
├── 🎨 UI Components
│   └── components/
│       ├── Desktop.tsx
│       ├── Dock.tsx
│       ├── MenuBar.tsx
│       ├── WindowFrame.tsx
│       └── apps/
│           ├── AboutMe.tsx
│           ├── Chat.tsx (old)
│           ├── Chat.refactored.tsx ✨
│           ├── Mail.tsx (old)
│           ├── Mail.refactored.tsx ✨
│           ├── Finder.tsx
│           ├── Resume.tsx
│           ├── Settings.tsx
│           └── Terminal.tsx
│
├── ⚙️ Core Logic
│   └── src/
│       ├── App.tsx (old)
│       ├── App.refactored.tsx ✨
│       │
│       ├── types/              ✨ NEW
│       │   ├── app.types.ts
│       │   ├── mail.types.ts
│       │   ├── chat.types.ts
│       │   ├── api.types.ts
│       │   └── index.ts
│       │
│       ├── config/             ✨ NEW
│       │   ├── env.config.ts
│       │   ├── api.config.ts
│       │   └── constants.ts
│       │
│       ├── services/           ✨ NEW
│       │   ├── api.ts
│       │   ├── mailService.ts
│       │   └── chatService.ts
│       │
│       ├── hooks/              ✨ NEW
│       │   ├── useWindowManager.ts
│       │   ├── useMailComposer.ts
│       │   └── useChat.ts
│       │
│       └── utils/              ✨ NEW
│           ├── validators.ts
│           ├── formatters.ts
│           └── storage.ts
│
└── 🔧 Configuration
    ├── types.ts (old - still used by old components)
    ├── constants.tsx (old - still used)
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## Component Dependencies

### Mail Component (Refactored)
```
Mail.refactored.tsx
  │
  ├── useMailComposer (hook)
  │   └── mailService
  │       └── apiClient
  │           └── /api/contact endpoint
  │
  └── Types: MailFormState, MailComposerData
```

### Chat Component (Refactored)
```
Chat.refactored.tsx
  │
  ├── useChat (hook)
  │   ├── chatService
  │   │   └── Google Gemini API
  │   └── storage utils
  │
  └── Types: ChatMessage, ChatApiResponse
```

### App Component (Refactored)
```
App.refactored.tsx
  │
  ├── useWindowManager (hook)
  │   └── Types: AppWindow, AppId
  │
  ├── storage utils
  │   └── Wallpaper persistence
  │
  └── Components: Desktop, MenuBar, Dock
```

---

## Type System Hierarchy

```
src/types/index.ts
    │
    ├── app.types.ts
    │   ├── AppId
    │   ├── AppWindow
    │   └── Project
    │
    ├── mail.types.ts
    │   ├── MailMessage
    │   ├── MailComposerData
    │   ├── MailApiResponse
    │   └── MailFormState
    │
    ├── chat.types.ts
    │   ├── ChatMessage
    │   ├── ToolCall
    │   ├── ChatApiRequest
    │   ├── ChatApiResponse
    │   └── AITool
    │
    └── api.types.ts
        ├── ApiError
        ├── ApiResponse<T>
        └── RequestConfig
```

---

## Configuration Flow

```
.env.local
    ↓
src/config/env.config.ts
    ↓
┌────────────────────────────┐
│  ENV object (type-safe)    │
│  - API_BASE_URL            │
│  - GEMINI_API_KEY          │
│  - ENABLE_ANALYTICS        │
│  - etc.                    │
└────────────────────────────┘
    ↓
Used by:
    ├── api.config.ts (API endpoints)
    ├── services/* (API clients)
    └── components/* (feature flags)
```

---

## Error Handling Chain

```
User Action
    ↓
Component (catches UI errors)
    ↓
Custom Hook (validates input)
    ↓
Service Layer (tries API call)
    ↓
API Client (retry logic, timeout)
    ↓
Backend (validates, processes)
    ↓
Response
    ↓
Service Layer (handles response)
    ↓
Custom Hook (updates state)
    ↓
Component (shows success/error)
    ↓
User sees result ✅ or ❌
```

---

## State Management

### Window State (Global)
```
App.refactored.tsx
    ↓
useWindowManager hook
    ↓
useState<AppWindow[]>
    ↓
Passed to: Desktop, Dock, MenuBar
```

### Mail Form State (Local)
```
Mail.refactored.tsx
    ↓
useMailComposer hook
    ↓
useState<MailFormState>
    ↓
Used only in Mail component
```

### Chat State (Local + Persisted)
```
Chat.refactored.tsx
    ↓
useChat hook
    ↓
useState<ChatMessage[]>
    ↓ ↑
localStorage (persistence)
    ↓
Restored on mount
```

---

## API Communication Pattern

```
Component
    ↓
Custom Hook
    ↓
Service Layer
    │
    ├─→ Validates input
    ├─→ Sanitizes data
    ├─→ Formats request
    │
    ↓
API Client
    │
    ├─→ Sets headers
    ├─→ Handles timeout
    ├─→ Implements retry
    ├─→ Catches errors
    │
    ↓
HTTP Request
    │
    ↓ (network)
    │
Backend API
    │
    ├─→ Validates
    ├─→ Processes
    ├─→ Returns JSON
    │
    ↓ (network)
    │
API Client
    │
    ├─→ Parses response
    ├─→ Handles errors
    │
    ↓
Service Layer
    │
    ├─→ Formats data
    ├─→ Returns result
    │
    ↓
Custom Hook
    │
    ├─→ Updates state
    │
    ↓
Component
    │
    └─→ Re-renders UI
```

---

## Backend Architecture

```
Frontend                    Backend
(Vite/React)               (Node.js/Express)

src/services/api.ts  ──────►  /api/contact
        │                           │
        │                           ├─ Middleware
        │                           │  ├─ CORS
        │                           │  ├─ Rate Limit
        │                           │  └─ Validation
        │                           │
        │                           ├─ Route Handler
        │                           │  └─ contactRoutes
        │                           │
        │                           ├─ Email Service
        │                           │  └─ Resend/SendGrid
        │                           │
        └────────◄──────────────────┴─ Response
```

---

## Migration Strategy Visualization

### Option 1: Gradual Migration
```
Day 1               Day 2               Day 3
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Test new │  →    │ Test in  │  →    │ Replace  │
│ locally  │       │ staging  │       │ old code │
└──────────┘       └──────────┘       └──────────┘
```

### Option 2: Direct Replacement
```
Backup old code → Replace files → Test thoroughly
```

---

## Performance Optimizations

```
┌─────────────────────────────────────┐
│  Component Level                    │
│  • React.memo for expensive renders │
│  • useCallback for handlers         │
│  • useMemo for computed values      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Hook Level                         │
│  • Debounce form inputs             │
│  • Cache API responses              │
│  • Lazy load heavy components       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Service Level                      │
│  • Request deduplication            │
│  • Response caching                 │
│  • Retry with exponential backoff  │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Backend Level                      │
│  • Database connection pooling      │
│  • Response compression             │
│  • CDN for static assets            │
└─────────────────────────────────────┘
```

---

## Security Layers

```
1. Frontend Validation
   └─ Immediate feedback, UX improvement
       ↓
2. Input Sanitization  
   └─ Remove malicious content
       ↓
3. Backend Validation
   └─ Server-side checks (never trust client)
       ↓
4. Rate Limiting
   └─ Prevent abuse
       ↓
5. CORS Configuration
   └─ Allow only trusted origins
       ↓
6. API Key Protection
   └─ Environment variables, never in code
       ↓
7. HTTPS/TLS
   └─ Encrypted communication
```

---

## Testing Strategy

```
Unit Tests
├── Utils (validators, formatters)
├── Services (mocked API responses)
└── Hooks (isolated logic)

Integration Tests
├── Component + Hook
├── Service + API Client
└── Full user flows

E2E Tests (Playwright)
├── Mail form submission
├── Chat conversation
└── Cross-browser compatibility
```

---

This visual guide complements the written documentation. Refer to:
- **GUIDE_INDEX.md** for navigation
- **QUICK_START.md** for setup
- **ARCHITECTURE.md** for detailed explanation
