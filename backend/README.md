# VIGIL - Backend

## Setup

```bash
npm install
```

Create `.env`:
```
PORT=3001
```

## Run

```bash
npm start
```

## API Endpoint

**POST** `/analyze`

### Request Body

```json
{
  "logs": [
    {
      "timestamp": "2025-01-17T14:30:00Z",
      "url": "https://github.com",
      "domain": "github.com"
    },
    {
      "timestamp": "2025-01-17T14:31:00Z",
      "url": "https://stackoverflow.com/questions/...",
      "domain": "stackoverflow.com"
    }
  ]
}
```

### Response (Success 200)

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

### Response (Error 500)

```json
{
  "error": "description of error"
}
```
