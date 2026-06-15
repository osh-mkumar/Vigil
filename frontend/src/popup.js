import { generateAnalytics } from './lib/analytics.js';

const statusBadge = document.getElementById('statusBadge');
const valFocus = document.getElementById('valFocus');
const valDeepWork = document.getElementById('valDeepWork');
const valSwitches = document.getElementById('valSwitches');

const trackingBtn = document.getElementById('trackingBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

let isTracking = false;

async function init() {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.warn("Not running in Chrome Extension environment");
    return;
  }

  // Get status
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    isTracking = response?.trackingEnabled || false;
    updateUI();
  });

  // Get metrics
  const { logs = [], userCategories = {} } = await chrome.storage.local.get(['logs', 'userCategories']);
  if (logs.length > 0) {
    const analytics = generateAnalytics(logs, userCategories);
    valFocus.textContent = analytics.focusScore;
    valDeepWork.textContent = `${analytics.deepWorkMinutes}m`;
    valSwitches.textContent = analytics.contextSwitches;
  }
}

function updateUI() {
  if (isTracking) {
    statusBadge.textContent = 'Active';
    statusBadge.className = 'status-badge active';
    trackingBtn.textContent = 'Stop Tracking';
    trackingBtn.className = 'action-btn tracking-toggle stop';
  } else {
    statusBadge.textContent = 'Inactive';
    statusBadge.className = 'status-badge inactive';
    trackingBtn.textContent = 'Start Tracking';
    trackingBtn.className = 'action-btn tracking-toggle';
  }
}

trackingBtn.addEventListener('click', () => {
  if (isTracking) {
    chrome.runtime.sendMessage({ action: 'stopTracking' }, () => {
      isTracking = false;
      updateUI();
    });
  } else {
    chrome.runtime.sendMessage({ action: 'startTracking' }, () => {
      isTracking = true;
      updateUI();
    });
  }
});

dashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
});

exportBtn.addEventListener('click', async () => {
  const { logs = [] } = await chrome.storage.local.get('logs');
  if (logs.length === 0) {
    alert("No data to export");
    return;
  }
  
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `vigil_export_${new Date().toISOString().split('T')[0]}.json`,
    saveAs: true
  });
});

clearBtn.addEventListener('click', async () => {
  if (confirm('Permanently delete all tracking data?')) {
    await chrome.storage.local.set({ logs: [] });
    valFocus.textContent = '--';
    valDeepWork.textContent = '--';
    valSwitches.textContent = '--';
  }
});

// Initialize
init();
