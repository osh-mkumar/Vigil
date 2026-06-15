# VIGIL Frontend

React + Vite minimal UI for privacy-first browser attention analytics.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Opens http://localhost:5173

## Architecture

**App.jsx** contains:
- Sample logs (hardcoded for demo)
- Analyze Session button that POSTs to `/api/analyze`
- Rendering of dashboard metrics (Focus Score, Deep Work Time, etc.)
- Loop detection visualization
- Error/loading states

**Vite proxy** (`vite.config.js`):
- Routes `/api/*` to `http://localhost:3001`
- Eliminates CORS issues during dev
- Production: frontend and backend on same origin

**CSS** (`App.css`):
- Simple color scheme
- Responsive layout
- No external libraries

## Component Structure

```
App
├── Header
├── Controls (Analyze button)
└── Results
    ├── Dashboard Metrics (Focus Score, Deep Work, Switches)
    └── Loop Detection (Research vs Distraction loops)
```

## Expected Backend Response

The component assumes the backend returns this JSON structure:

```json
{
  "focusScore": 78,
  "deepWorkTime": 45,
  "contextSwitchCount": 12,
  "longestFocusSession": 25,
  "researchLoops": [
    {
      "domains": ["github.com", "stackoverflow.com"],
      "occurrences": 4
    }
  ],
  "distractionLoops": [
    {
      "domains": ["twitter.com", "news.ycombinator.com"],
      "occurrences": 2
    }
  ]
}
```

## Design Decisions

- **No state management library** – useState is enough for this demo
- **Hardcoded logs** – In production, these come from Chrome extension
- **Proxy in Vite** – Simple, avoids deployment complexity
- **Minimal styling** – Focus on layout clarity, not design
