// Popup UI controller for VIGIL extension

const trackBtn = document.getElementById('trackBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const logCountDiv = document.getElementById('logCount');
const errorDiv = document.getElementById('error');

let isTracking = false;

// Initialize popup state
async function init() {
  // Get tracking status from background
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    isTracking = response.trackingEnabled;
    updateUI();
  });

  // Get log count
  updateLogCount();
}

// Update UI based on tracking state
function updateUI() {
  if (isTracking) {
    statusDiv.textContent = '✅ Tracking active';
    statusDiv.className = 'status tracking';
    trackBtn.textContent = 'Stop Tracking';
    trackBtn.className = 'btn-danger';
  } else {
    statusDiv.textContent = '⏸️ Tracking disabled';
    statusDiv.className = 'status';
    trackBtn.textContent = 'Start Tracking';
    trackBtn.className = 'btn-primary';
  }
}

// Update log count display
async function updateLogCount() {
  const { logs = [] } = await chrome.storage.local.get('logs');
  logCountDiv.textContent = `${logs.length} activities recorded`;
}

// Toggle tracking on/off
trackBtn.addEventListener('click', async () => {
  if (isTracking) {
    // Stop tracking
    chrome.runtime.sendMessage({ action: 'stopTracking' }, (response) => {
      isTracking = false;
      updateUI();
      showError('Tracking stopped', false);
    });
  } else {
    // Start tracking
    chrome.runtime.sendMessage({ action: 'startTracking' }, (response) => {
      isTracking = true;
      updateUI();
      showError('Tracking started! Switch tabs to record activity', false);
    });
  }
});

// Send logs to backend for analysis
analyzeBtn.addEventListener('click', async () => {
  const { logs = [] } = await chrome.storage.local.get('logs');

  if (logs.length === 0) {
    showError('No activity logs to analyze. Start tracking first!');
    return;
  }

  // Disable button during request
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  statusDiv.textContent = '🔄 Analyzing Session...';
  statusDiv.className = 'status analyzing';
  errorDiv.style.display = 'none';

  try {
    // Send logs to backend
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const analysis = await response.json();

    // Success - open web app to view results
    showError('✅ Analysis complete! Opening results...', false);
    
    // Encode analysis as URL parameter
    const analysisData = encodeURIComponent(JSON.stringify(analysis));
    
    // Open web app in new tab with analysis data
    chrome.tabs.create({ url: `http://localhost:5173?analysis=${analysisData}` });

  } catch (error) {
    console.error('Analysis error:', error);
    showError(`Error: ${error.message}. Make sure backend is running on port 3001.`);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Session';
    updateUI();
  }
});

// Clear stored logs
clearBtn.addEventListener('click', async () => {
  if (!confirm('Clear all recorded activity logs?')) {
    return;
  }

  await chrome.storage.local.set({ logs: [] });
  updateLogCount();
  showError('Logs cleared', false);
});

// Show error or info message
function showError(message, isError = true) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  errorDiv.style.background = isError ? '#fee' : '#dcfce7';
  errorDiv.style.borderLeftColor = isError ? '#ef4444' : '#16a34a';
  errorDiv.style.color = isError ? '#991b1b' : '#166534';

  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 4000);
}

// Refresh log count every 2 seconds when popup is open
setInterval(updateLogCount, 2000);

// Initialize on popup open
init();
