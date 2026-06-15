# Chrome Extension Setup

## Installation Steps

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in top-right corner

3. **Load Extension**
   - Click "Load unpacked"
   - Select: `C:\Users\manmo\Desktop\Vigil\extension`
   - Extension should appear with icon

4. **Verify Installation**
   - Extension icon should appear in toolbar
   - Click icon to open popup

## Usage Flow

**Step 1: Start Backend**
```bash
cd backend
npm start
```
Backend runs on http://localhost:3001

**Step 2: Start Tracking**
- Click extension icon
- Click "Start Tracking"
- Status shows: ✅ Tracking active

**Step 3: Browse Normally**
- Switch between tabs
- Visit websites
- Activity is recorded locally

**Step 4: Analyze**
- Click extension icon
- Check activity count (e.g., "15 activities recorded")
- Click "Analyze Session"
- Web app opens with analysis results

## Testing Checklist

- [ ] Extension loads without errors
- [ ] "Start Tracking" enables tracking
- [ ] Tab switches increment activity count
- [ ] "Analyze Session" calls backend successfully
- [ ] Results open in web app at localhost:5173
- [ ] "Clear Logs" removes stored activities
- [ ] "Stop Tracking" disables tracking
