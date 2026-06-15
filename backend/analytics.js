import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const categoriesPath = path.join(__dirname, 'domainCategories.json');
let categories = {};
try {
  categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
} catch (error) {
  console.error("Error loading domainCategories.json:", error);
}

/**
 * Returns the category for a given domain based on domainCategories.json
 */
export function getCategory(domain) {
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.includes(domain)) {
      return category;
    }
  }
  return 'Unknown';
}

/**
 * Core engine to process an array of logs into structured analytics
 */
export function generateAnalytics(logs) {
  if (!logs || logs.length === 0) {
    return getEmptyResponse();
  }

  // Sort logs chronologically
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Augment logs with category and calculated duration
  const processedLogs = sortedLogs.map((log, index) => {
    const category = getCategory(log.domain);
    let durationMinutes = 0;

    if (index < sortedLogs.length - 1) {
      const current = new Date(log.timestamp);
      const next = new Date(sortedLogs[index + 1].timestamp);
      durationMinutes = (next - current) / (1000 * 60);
    } else {
      // Assign a default 5-minute duration to the last log entry in the session
      durationMinutes = 5;
    }

    return { ...log, category, durationMinutes };
  });

  return {
    focusScore: calculateFocusScore(processedLogs),
    deepWorkTime: calculateDeepWorkTime(processedLogs),
    contextSwitchCount: processedLogs.length > 1 ? processedLogs.length - 1 : 0,
    longestFocusSession: calculateLongestSession(processedLogs),
    researchLoops: detectResearchLoops(processedLogs),
    distractionLoops: detectDistractionLoops(processedLogs)
  };
}

/**
 * Focus score depends on: session duration, switching frequency, fragmentation, and continuity.
 */
function calculateFocusScore(logs) {
  const totalDuration = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  if (totalDuration === 0) return 0;

  const switches = logs.length - 1;
  const switchRate = switches / (totalDuration / 60 || 1); // switches per hour
  
  let score = 100;

  // Penalize high fragmentation (frequent context switches)
  if (switchRate > 30) score -= 40;
  else if (switchRate > 15) score -= 20;
  else if (switchRate > 5) score -= 5;

  // Penalize lack of continuity (very short average duration per tab)
  const avgDuration = totalDuration / logs.length;
  if (avgDuration < 1) score -= 30;
  else if (avgDuration < 3) score -= 15;

  // Reward longer overall sessions with good continuity
  if (totalDuration > 60 && switchRate < 10) score = Math.min(100, score + 10);

  return Math.max(0, Math.round(score));
}

function calculateDeepWorkTime(logs) {
  // Accumulate time spent in continuous blocks of > 15 minutes
  let totalDeepWork = 0;
  for (const log of logs) {
    if (log.durationMinutes >= 15) {
      totalDeepWork += log.durationMinutes;
    }
  }
  return Math.round(totalDeepWork);
}

function calculateLongestSession(logs) {
  let longest = 0;
  for (const log of logs) {
    if (log.durationMinutes > longest) {
      longest = log.durationMinutes;
    }
  }
  return Math.round(longest);
}

/**
 * Detects research loops based on category transitions.
 * Examples: 
 * Development -> Documentation -> Development
 * Development -> Search -> Documentation -> Development
 */
function detectResearchLoops(logs) {
  const loops = {};

  for (let i = 0; i < logs.length - 2; i++) {
    const log1 = logs[i];
    const log2 = logs[i+1];
    
    // Pattern 1: Dev -> Docs -> Dev
    if (i + 2 < logs.length) {
      const log3 = logs[i+2];
      if (log1.category === 'Development' && log2.category === 'Documentation' && log3.category === 'Development') {
        const key = `${log1.domain} ↔ ${log2.domain}`;
        loops[key] = (loops[key] || 0) + 1;
      }
    }

    // Pattern 2: Dev -> Search -> Docs -> Dev
    if (i + 3 < logs.length) {
      const log3 = logs[i+2];
      const log4 = logs[i+3];
      if (log1.category === 'Development' && log2.category === 'Search' && 
          log3.category === 'Documentation' && log4.category === 'Development') {
        const key = `${log1.domain} → ${log2.domain} → ${log3.domain}`;
        loops[key] = (loops[key] || 0) + 1;
      }
    }
  }

  // Format output for the frontend
  return Object.entries(loops).map(([domainsStr, occurrences]) => ({
    domains: domainsStr.split(' ↔ ').length > 1 ? domainsStr.split(' ↔ ') : domainsStr.split(' → '),
    occurrences
  }));
}

/**
 * Detects distraction loops based on category transitions.
 * Examples: Social -> Entertainment -> Social
 */
function detectDistractionLoops(logs) {
  const loops = {};

  for (let i = 0; i < logs.length - 2; i++) {
    const log1 = logs[i];
    const log2 = logs[i+1];
    const log3 = logs[i+2];

    const isDistractionCategory = (cat) => ['Social', 'Entertainment', 'Video'].includes(cat);

    // If 3 consecutive logs are in distraction categories, we call it a loop
    if (isDistractionCategory(log1.category) && 
        isDistractionCategory(log2.category) && 
        isDistractionCategory(log3.category)) {
        
        // Ensure they aren't all just the same domain repeatedly
        if (log1.domain !== log2.domain || log2.domain !== log3.domain) {
          const key = `${log1.domain} ↔ ${log2.domain}`;
          loops[key] = (loops[key] || 0) + 1;
        }
    }
  }

  return Object.entries(loops).map(([domainsStr, occurrences]) => ({
    domains: domainsStr.split(' ↔ '),
    occurrences
  }));
}

function getEmptyResponse() {
  return {
    focusScore: 0,
    deepWorkTime: 0,
    contextSwitchCount: 0,
    longestFocusSession: 0,
    researchLoops: [],
    distractionLoops: []
  };
}
