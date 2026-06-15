// Background service worker for VIGIL session tracking

const DOMAIN_CATEGORIES = {
  "Development": [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "stackoverflow.com",
    "developer.mozilla.org",
    "canva.com",
    "adobe.com"
  ],
  "Learning": [
    "coursera.org",
    "udemy.com",
    "freecodecamp.org",
    "leetcode.com",
    "geeksforgeeks.org",
    "wikipedia.org",
    "chatgpt.com",
    "gemini.google.com",
    "claude.ai",
    "openai.com",
    "quora.com",
    "instructure.com",
    "deepseek.com",
    "tradingview.com",
    "chat.deepseek.com"
  ],
  "Documentation": [
    "docs.python.org",
    "react.dev",
    "nodejs.org",
    "notion.so",
    "microsoft.com",
    "ilovepdf.com",
    "acesso.gov.br"
  ],
  "Communication": [
    "gmail.com",
    "mail.google.com",
    "outlook.com",
    "slack.com",
    "discord.com",
    "teams.microsoft.com",
    "whatsapp.com",
    "microsoftonline.com",
    "live.com",
    "office.com",
    "telegram.org",
    "zoom.us",
    "mail.ru",
    "messenger.com"
  ],
  "Video": [
    "youtube.com",
    "vimeo.com",
    "twitch.tv",
    "dailymotion.com",
    "bilibili.com"
  ],
  "Social": [
    "instagram.com",
    "x.com",
    "twitter.com",
    "facebook.com",
    "reddit.com",
    "pinterest.com",
    "tiktok.com",
    "linkedin.com",
    "vk.com",
    "steamcommunity.com",
    "linktr.ee",
    "threads.com",
    "snapchat.com"
  ],
  "Entertainment": [
    "netflix.com",
    "primevideo.com",
    "hotstar.com",
    "fandom.com",
    "spotify.com",
    "imdb.com",
    "roblox.com",
    "supercell.com",
    "espn.com",
    "steampowered.com",
    "disneyplus.com",
    "hbomax.com",
    "genius.com",
    "msn.com"
  ],
  "Search": [
    "google.com",
    "bing.com",
    "duckduckgo.com",
    "yahoo.com",
    "yahoo.co.jp",
    "yandex.ru",
    "naver.com",
    "brave.com",
    "ecosia.org",
    "opera.com",
    "google.com.br"
  ],
  "Productivity": [
    "drive.google.com"
  ]
};

function getCategory(domain) {
  if (!domain) return 'Unknown';
  
  const cleanHost = domain.replace(/^www\./, '');
  
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.includes(cleanHost)) return category;
    
    for (const d of domains) {
      if (cleanHost.endsWith('.' + d)) return category;
    }
  }
  return 'Unknown';
}

let activeSession = null;
let trackingEnabled = false;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ trackingEnabled: false, logs: [], activeSession: null });
  chrome.idle.setDetectionInterval(60); // 60 seconds idle detection
  console.log('VIGIL installed');
});

// Load initial state
chrome.storage.local.get(['trackingEnabled', 'activeSession'], (res) => {
  trackingEnabled = res.trackingEnabled || false;
  activeSession = res.activeSession || null;
});

// End the current session and save it
async function endSession() {
  if (!activeSession) return;
  
  const endTime = new Date();
  const durationSeconds = Math.round((endTime.getTime() - new Date(activeSession.startTime).getTime()) / 1000);
  
  if (durationSeconds > 0) {
    const sessionLog = {
      domain: activeSession.domain,
      category: activeSession.category,
      startTime: activeSession.startTime,
      endTime: endTime.toISOString(),
      durationSeconds
    };
    
    const { logs = [] } = await chrome.storage.local.get('logs');
    logs.push(sessionLog);
    await chrome.storage.local.set({ logs });
    console.log('✓ Session ended:', sessionLog);
  }
  
  activeSession = null;
  await chrome.storage.local.set({ activeSession: null });
}

// Start a new session
async function startSession(tabId, urlStr) {
  if (!trackingEnabled || !urlStr) return;
  if (urlStr.startsWith('chrome://') || urlStr.startsWith('about:') || urlStr.startsWith('chrome-extension://')) return;
  
  let domain = 'unknown';
  try {
    const url = new URL(urlStr);
    domain = url.hostname;
  } catch (e) {
    console.warn('Could not parse URL:', urlStr);
    return;
  }

  activeSession = {
    domain,
    category: getCategory(domain),
    startTime: new Date().toISOString(),
    tabId
  };
  
  await chrome.storage.local.set({ activeSession });
  console.log('✓ Session started:', domain);
}

// Check active tab and adjust session
async function handleTabChange() {
  if (!trackingEnabled) return;
  
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) return;
  const tab = tabs[0];
  
  if (!tab.url) return;
  
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
    await endSession();
    return;
  }

  // If we're already tracking this exact tab domain, do nothing
  if (activeSession && activeSession.tabId === tab.id) {
    let currentDomain = 'unknown';
    try {
        currentDomain = new URL(tab.url).hostname;
    } catch(e){}
    if (activeSession.domain === currentDomain) return;
  }
  
  // End old, start new
  await endSession();
  await startSession(tab.id, tab.url);
}

// Tab switched
chrome.tabs.onActivated.addListener(() => {
  handleTabChange();
});

// Tab updated (URL change within same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    handleTabChange();
  }
});

// Idle detection
chrome.idle.onStateChanged.addListener(async (state) => {
  if (!trackingEnabled) return;
  
  if (state === 'idle' || state === 'locked') {
    console.log('User went idle, ending session');
    await endSession();
  } else if (state === 'active') {
    console.log('User is active, starting session');
    handleTabChange();
  }
});

// Window focus changed (optional enhancement to handle multi-window edge cases)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // All chrome windows lost focus
    endSession();
  } else {
    handleTabChange();
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTracking') {
    trackingEnabled = true;
    chrome.storage.local.set({ trackingEnabled: true });
    handleTabChange();
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopTracking') {
    trackingEnabled = false;
    chrome.storage.local.set({ trackingEnabled: false });
    endSession();
    sendResponse({ status: 'stopped' });
  } else if (message.action === 'getStatus') {
    sendResponse({ trackingEnabled });
  }
});
