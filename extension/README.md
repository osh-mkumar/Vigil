# VIGIL Chrome Extension

Chrome Extension for tracking tab activity and generating privacy-first browser attention analytics.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension/` folder

## Usage

1. **Start Tracking**: Click extension icon → "Start Tracking"
2. **Browse normally**: Extension tracks active tab switches
3. **Analyze**: Click "Analyze Session" to process your logs
4. **View Results**: Web app opens automatically with your session analytics

## Privacy

- Data stored locally until you click "Analyze Session"
- No background uploads or third-party tracking
- Only tracks tab URLs and timestamps
- No keystroke or content tracking

## File Structure

```
extension/
├── manifest.json      # Chrome extension configuration (MV3)
├── background.js      # Tab tracking service worker
├── popup.html         # Extension popup UI
├── popup.js          # Popup logic and communication
└── README.md         # This file
```

## Backend Integration

Sends POST request to `http://localhost:3001/analyze` with body:
```json
{
  "logs": [
    {
      "timestamp": "2025-01-17T14:00:00.000Z",
      "url": "https://github.com/user/repo",
      "domain": "github.com"
    }
  ]
}
```

## Features

- ✅ Minimal permissions (tabs, storage only)
- ✅ User consent required before tracking
- ✅ Local-first data storage
- ✅ Clean integration with existing backend
