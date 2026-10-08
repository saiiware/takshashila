# Taskhashila— Frontend Prototype

A frontend-only prototype of an AI-assisted, multilingual skill-development
platform for rural communities. Built for one MVP course of 10 videos, with
all AI features stubbed out behind a service layer that is already shaped
for a future FastAPI + PostgreSQL backend.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

There is no real backend yet — signup/login, enrollment, progress, and the
AI Assistant all run on mock data stored in `localStorage` so the flow feels
real across page reloads.

## Try the full flow

1. **Sign up** with any name, email/mobile, and password, and pick a
   preferred language.
2. Land on the **Dashboard** — no course registered yet.
3. Go to **My Course**, read the overview, and **Register**.
4. Open **Video 1** from the video list.
5. Use **Mark as completed**, then **Next →** to move through videos.
6. Open the **AI Assistant** panel on the video page (or the standalone
   **AI Assistant** nav item) and ask a question — you'll get a canned
   placeholder response and can also try the microphone button.
7. Check **Profile** to see progress and switch language.

## Project structure

```
src/
  types/         Shared TypeScript interfaces (including the request/response
                 shapes the future FastAPI endpoints will use)
  data/          Mock course + language data
  services/      One file per future backend concern (auth, course,
                 progress, AI). Each function mirrors a real endpoint listed
                 in services/api.ts and currently returns mock data.
  context/       React context for auth state and course progress
  components/
    common/      Generic UI building blocks (Button, Card, ProgressBar, ...)
    layout/      Sidebar, mobile bottom nav, page shell
    course/      Course-specific pieces (video list row, summary card)
    ai/          Chat bubble, chat input, and the full assistant panel
    auth/        Route guard
  pages/         One file per route
```

## Connecting the real backend later

Every mock service function (`src/services/*.ts`) documents the endpoint it
stands in for, and `src/services/api.ts` lists the full planned API surface:

```
POST /auth/register        POST /auth/login
GET  /courses               GET  /courses/{id}
POST /courses/{id}/enroll   GET  /videos/{id}
POST /progress               POST /ai/ask
POST /speech/transcribe      POST /speech/synthesize
```

To wire a real backend in, replace the body of each service function with a
call to `apiRequest(...)` — the rest of the app (context, components, pages)
already consumes these functions through their existing return types, so no
other code needs to change.

## Design notes

The interface is built for first-time or low-frequency digital users:
large touch targets, plain sentence-case copy, a persistent labelled nav
(sidebar on desktop, bottom tabs on mobile) instead of a hamburger menu, and
a warm, low-contrast card layout rather than a dense analytics dashboard.
