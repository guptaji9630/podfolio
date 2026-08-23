# AGENTS.md - Podfolio Repository Instructions

## Behavioral Guidelines (opencode)

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Repository Structure

This is a monorepo with two packages:

```
podfolio/
├── pod-mac-vite/pod/       # Frontend (React + Vite + TypeScript) - MAIN
└── pod-mac-vite/pod-backend/   # Backend (Express + TypeScript) - runs separately
```

## Quick Commands (Frontend Only)

### Frontend (pod-mac-vite/pod) - PRIMARY
```bash
cd pod-mac-vite/pod
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

### Backend (pod-mac-vite/pod-backend) - SEPARATE DEPLOYMENT
Runs on different route/port. Not needed for frontend development.
```bash
cd pod-mac-vite/pod-backend
npm install
npm run dev          # Port 3000 (tsx watch)
npm run build
npm start
```

## Environment Variables

### Frontend (.env.local in pod-mac-vite/pod/)
```
API_KEY=google_gemini_api_key   # Required for AI chat feature
```

### Backend (.env in pod-mac-vite/pod-backend/) - NOT NEEDED FOR FRONTEND
```
PORT=3000
RESEND_API_KEY=your_resend_api_key
RECIPIENT_EMAIL=abhishekg9630@gmail.com
ALLOWED_ORIGINS=http://localhost:5173
```

## Key Architecture (Frontend)

- **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS 4** (via @tailwindcss/vite)
- **State management**: React hooks (`useWindowManager`, `useChat`, `useMailComposer`)
- **Design system**: Custom CSS variables in `index.css` (glass morphism, colors, spacing, animations)
- **Window management**: Custom z-index, focus, drag/resize logic
- **Backend communication**: Contact form POSTs to `/api/contact` (backend runs separately)

## Important Files (Frontend)

| File | Purpose |
|------|---------|
| `pod/src/App.tsx` | Main app, window state, wallpaper, accent color, INITIAL_WINDOWS |
| `pod/src/hooks/useWindowManager.ts` | Window z-index, focus, minimize logic |
| `pod/components/WindowFrame.tsx` | Draggable/resizable window component with traffic lights |
| `pod/components/Dock.tsx` | App launcher with magnification, centered |
| `pod/components/MenuBar.tsx` | Top menu bar with app menus, Spotlight, date/time |
| `pod/components/Desktop.tsx` | Desktop container, wallpaper, desktop icons, window rendering |
| `pod/components/apps/Browser.tsx` | Projects showcase (grid/list, search, categories, GitHub/demo links) |
| `pod/components/apps/AboutMe.tsx` | Profile with timeline, metrics, skills, quick actions |
| `pod/components/apps/Resume.tsx` | PDF download via html2canvas + jsPDF |
| `pod/components/apps/Terminal.tsx` | Interactive terminal (`help`, `ls`, `cd`, `cat`, `whoami`, `projects`, `contact`, `exit`) |
| `pod/components/apps/Chat.tsx` | AI chat (Gemini via backend proxy) |
| `pod/components/apps/Mail.tsx` | Contact form (POSTs to backend /api/contact) |
| `pod/components/apps/Settings.tsx` | 5 tabs: General, Network, Bluetooth, Wallpaper, Appearance |
| `pod/components/apps/Finder.tsx` | Traditional file browser with sidebar |
| `pod/constants.tsx` | Projects data (6 projects with GitHub URLs, live demos, tech stacks) |
| `pod/src/types/app.types.ts` | AppId type, AppWindow, Project interface |
| `pod/index.css` | Design tokens, glass morphism, animations, button/input/card systems |

## Adding/Modifying Features (Frontend)

| Feature | Where to Edit |
|---------|---------------|
| Projects data | `pod/constants.tsx` (Project interface in `pod/src/types/app.types.ts`) |
| Wallpapers | `pod/src/config/constants.ts` (WALLPAPERS array) |
| Terminal commands | `pod/components/apps/Terminal.tsx` (handleCmd function) |
| AI chat context | `pod/components/apps/Chat.tsx` (system instruction in useChat) |
| Window apps (add/remove) | 1. `pod/src/types/app.types.ts` (AppId) 2. `pod/src/App.tsx` (INITIAL_WINDOWS) 3. `pod/components/Desktop.tsx` (renderAppContent) 4. `pod/components/Dock.tsx` (dockItems) |
| Contact form fields | `pod/components/apps/Mail.tsx` + backend `pod-backend/src/routes/contact.ts` |
| Accent colors | `pod/components/apps/Settings.tsx` (accentColors array) |
| Design tokens | `pod/index.css` (@theme section) |

## Common Issues

- **Port 5173 in use**: Kill process or change Vite port in `vite.config.ts`
- **Port 3000 in use** (backend): `lsof -ti:3000 | xargs kill -9`
- **CORS errors**: Check `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:5173`
- **Resend not sending**: Verify API key, use verified domain or `onboarding@resend.dev` for testing
- **AI chat not working**: Check `API_KEY` in frontend `.env.local` (needs Google Gemini API key)
- **Build chunk warnings**: Normal for this size, consider dynamic imports for code-splitting

## Development Notes

- **Frontend dev server**: `npm run dev` → http://localhost:5173
- **Backend runs separately** on different port/route
- **TypeScript strict mode** enabled
- **Build output**: `pod/dist/`
- **No lint/test scripts** configured - only build
- **Tailwind 4** uses `@tailwindcss/vite` plugin (not PostCSS)

## Deployment (Frontend)

- **Vercel/Netlify/GitHub Pages**: Build output in `pod/dist/`
- **Environment variables**: Add `API_KEY` in platform dashboard
- **Vite config**: Update `base` in `vite.config.ts` for GitHub Pages subpath deployment