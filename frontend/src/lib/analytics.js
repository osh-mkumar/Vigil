import categories from './domainCategories.json';

export function getClassificationInfo(domain, userCategories = {}) {
  if (!domain) return { category: 'Unknown', classifiedBy: 'No match found' };
  
  const cleanHost = domain.replace(/^www\./, '');
  
  if (userCategories[cleanHost] || userCategories[domain]) {
    return { 
      category: userCategories[cleanHost] || userCategories[domain], 
      classifiedBy: 'User Override' 
    };
  }
  
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.includes(cleanHost)) {
      return { category, classifiedBy: 'Exact Dictionary Match' };
    }
    for (const d of domains) {
      if (cleanHost.endsWith('.' + d)) {
        return { category, classifiedBy: 'Subdomain Match' };
      }
    }
  }
  return { category: 'Unknown', classifiedBy: 'No match found' };
}

export function getCategory(domain, userCategories = {}) {
  return getClassificationInfo(domain, userCategories).category;
}

export function getUnclassifiedDomains(logs, userCategories = {}) {
  const unclassified = new Map();
  for (const log of logs) {
    const category = getCategory(log.domain, userCategories);
    if (category === 'Unknown') {
      const cleanHost = log.domain.replace(/^www\./, '');
      const durationMinutes = typeof log.durationSeconds === 'number' ? log.durationSeconds / 60 : 5;
      unclassified.set(cleanHost, (unclassified.get(cleanHost) || 0) + durationMinutes);
    }
  }
  
  return Array.from(unclassified.entries())
    .map(([domain, time]) => ({ domain, timeSpentMinutes: Math.round(time) }))
    .sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes);
}

export function generateAnalytics(logs, userCategories = {}) {
  if (!logs || logs.length === 0) {
    return getEmptyResponse();
  }

  // Sort chronologically
  const sortedLogs = [...logs].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Ensure category and durationMinutes exist
  const processedLogs = sortedLogs.map((log) => {
    // Force re-evaluation of category using userCategories
    const { category, classifiedBy } = getClassificationInfo(log.domain, userCategories);
    const durationMinutes = typeof log.durationSeconds === 'number' 
      ? Math.round(log.durationSeconds / 60)
      : 5;
    return { ...log, category, durationMinutes: Math.max(1, durationMinutes), classifiedBy };
  });

  const deepWorkSessions = detectDeepWork(processedLogs);
  
  // Total deep work minutes
  const deepWorkMinutes = deepWorkSessions.reduce((sum, session) => sum + session.durationMinutes, 0);

  // Longest single contiguous log session
  let longestSession = 0;
  for (const log of processedLogs) {
    if (log.durationMinutes > longestSession) longestSession = log.durationMinutes;
  }

  // Generate Timeline Data
  const timeline = processedLogs.map(log => {
    const startDate = new Date(log.startTime || Date.now());
    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
    
    let endHours = '';
    let endMinutes = '';
    if (log.endTime) {
      const endDate = new Date(log.endTime);
      endHours = endDate.getHours().toString().padStart(2, '0');
      endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    }

    return {
      domain: log.domain,
      time: `${startHours}:${startMinutes}`,
      endTimeStr: log.endTime ? `${endHours}:${endMinutes}` : 'Ongoing',
      category: log.category,
      duration: log.durationMinutes || 1
    };
  });

  const researchLoops = detectResearchLoops(processedLogs);

  return {
    focusScore: calculateFocusScore(processedLogs, deepWorkMinutes, researchLoops),
    deepWorkMinutes: Math.round(deepWorkMinutes),
    contextSwitches: processedLogs.length > 1 ? processedLogs.length - 1 : 0,
    longestSession: Math.round(longestSession),
    researchLoops: researchLoops,
    distractionLoops: detectDistractionLoops(processedLogs),
    communicationInterruptions: detectCommunicationInterruptions(processedLogs),
    categoryBreakdown: calculateCategoryBreakdown(processedLogs),
    timeline: timeline,
    rawLogs: processedLogs
  };
}

function calculateFocusScore(logs, totalDeepWorkMinutes, researchLoops = []) {
  const totalDuration = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  if (totalDuration === 0) return 0;

  const switches = logs.length - 1;
  const switchRate = switches / (totalDuration / 60 || 1); // switches per hour
  
  let score = 100;

  if (switchRate > 30) score -= 40;
  else if (switchRate > 15) score -= 20;
  else if (switchRate > 5) score -= 5;

  const avgDuration = totalDuration / logs.length;
  if (avgDuration < 1) score -= 20;
  else if (avgDuration < 3) score -= 10;

  const deepWorkBonus = Math.floor(totalDeepWorkMinutes / 30) * 10;
  score += Math.min(20, deepWorkBonus);

  // Add bonus for research loops
  const totalResearchLoopOccurrences = researchLoops.reduce((sum, loop) => sum + loop.occurrences, 0);
  const researchBonus = totalResearchLoopOccurrences * 5;
  score += Math.min(20, researchBonus);

  return Math.min(100, Math.max(0, Math.round(score)));
}

function detectDeepWork(logs) {
  const PRODUCTIVE_CATEGORIES = ['Development', 'Learning', 'Documentation'];
  const sessions = [];
  let currentSession = null;

  for (const log of logs) {
    if (PRODUCTIVE_CATEGORIES.includes(log.category)) {
      if (!currentSession) {
        currentSession = {
          startTime: log.startTime,
          endTime: log.endTime,
          durationMinutes: log.durationMinutes,
          category: 'Deep Work'
        };
      } else {
        currentSession.endTime = log.endTime;
        currentSession.durationMinutes += log.durationMinutes;
      }
    } else {
      if (currentSession) {
        if (currentSession.durationMinutes >= 15) {
          sessions.push(currentSession);
        }
        currentSession = null;
      }
    }
  }
  if (currentSession && currentSession.durationMinutes >= 15) {
    sessions.push(currentSession);
  }
  return sessions;
}

function detectResearchLoops(logs) {
  const loopsMap = new Map();
  for (let i = 0; i < logs.length - 2; i++) {
    const c1 = logs[i].category;
    const c2 = logs[i+1].category;
    const c3 = logs[i+2].category;

    if ((c1 === 'Development' && c2 === 'Documentation' && c3 === 'Development') ||
        (c1 === 'Learning' && c2 === 'Search' && c3 === 'Learning')) {
      const key = `${c1} → ${c2} → ${c3}`;
      const duration = logs[i].durationMinutes + logs[i+1].durationMinutes + logs[i+2].durationMinutes;
      if (loopsMap.has(key)) {
        const loop = loopsMap.get(key);
        loop.occurrences += 1;
        loop.totalDuration += duration;
      } else {
        loopsMap.set(key, { type: "Research Loop", categories: [c1, c2, c3], occurrences: 1, totalDuration: duration });
      }
    }

    if (i + 3 < logs.length) {
      const c4 = logs[i+3].category;
      if (c1 === 'Development' && c2 === 'Search' && c3 === 'Documentation' && c4 === 'Development') {
        const key = `${c1} → ${c2} → ${c3} → ${c4}`;
        const duration = logs[i].durationMinutes + logs[i+1].durationMinutes + logs[i+2].durationMinutes + logs[i+3].durationMinutes;
        if (loopsMap.has(key)) {
          const loop = loopsMap.get(key);
          loop.occurrences += 1;
          loop.totalDuration += duration;
        } else {
          loopsMap.set(key, { type: "Research Loop", categories: [c1, c2, c3, c4], occurrences: 1, totalDuration: duration });
        }
      }
    }
  }
  return Array.from(loopsMap.values()).map(l => ({ ...l, totalDuration: Math.round(l.totalDuration) }));
}

function detectCommunicationInterruptions(logs) {
  const interruptions = [];
  const PRODUCTIVE_CATEGORIES = ['Development', 'Learning', 'Documentation'];

  for (let i = 0; i < logs.length - 2; i++) {
    const c1 = logs[i].category;
    const c2 = logs[i+1].category;
    const c3 = logs[i+2].category;

    if (PRODUCTIVE_CATEGORIES.includes(c1) && c2 === 'Communication' && PRODUCTIVE_CATEGORIES.includes(c3)) {
      interruptions.push({
        interruptionType: "Async Check",
        duration: Math.round(logs[i+1].durationMinutes),
        interruptedCategory: c1
      });
    }
  }
  return interruptions;
}

function detectDistractionLoops(logs) {
  const DISTRACTING = ['Social', 'Video', 'Entertainment'];
  const loopsMap = new Map();

  for (let i = 0; i < logs.length - 2; i++) {
    const c1 = logs[i].category;
    const c2 = logs[i+1].category;
    const c3 = logs[i+2].category;

    if (DISTRACTING.includes(c1) && DISTRACTING.includes(c2) && DISTRACTING.includes(c3)) {
      const key = `${c1} → ${c2} → ${c3}`;
      const duration = logs[i].durationMinutes + logs[i+1].durationMinutes + logs[i+2].durationMinutes;
      if (loopsMap.has(key)) {
        const loop = loopsMap.get(key);
        loop.occurrences += 1;
        loop.totalDuration += duration;
      } else {
        loopsMap.set(key, { loopType: "Distraction Spiral", categories: [c1, c2, c3], occurrences: 1, totalDuration: duration });
      }
    }

    if (!DISTRACTING.includes(c1) && DISTRACTING.includes(c2) && DISTRACTING.includes(c3)) {
      const key = `${c1} → ${c2} → ${c3}`;
      const duration = logs[i].durationMinutes + logs[i+1].durationMinutes + logs[i+2].durationMinutes;
      if (loopsMap.has(key)) {
        const loop = loopsMap.get(key);
        loop.occurrences += 1;
        loop.totalDuration += duration;
      } else {
        loopsMap.set(key, { loopType: "Distraction Spiral", categories: [c1, c2, c3], occurrences: 1, totalDuration: duration });
      }
    }
  }
  return Array.from(loopsMap.values()).map(l => ({ ...l, totalDuration: Math.round(l.totalDuration) }));
}

function calculateCategoryBreakdown(logs) {
  const breakdown = {
    Development: 0,
    Learning: 0,
    Documentation: 0,
    Communication: 0,
    Social: 0,
    Video: 0,
    Entertainment: 0,
    Search: 0,
    Shopping: 0,
    Finance: 0,
    Productivity: 0,
    Other: 0,
    Unknown: 0
  };

  for (const log of logs) {
    if (breakdown[log.category] !== undefined) {
      breakdown[log.category] += log.durationMinutes;
    } else {
      breakdown.Unknown += log.durationMinutes;
    }
  }

  for (const key of Object.keys(breakdown)) {
    breakdown[key] = Math.round(breakdown[key]);
  }
  return breakdown;
}

function getEmptyResponse() {
  return {
    focusScore: 0,
    deepWorkMinutes: 0,
    contextSwitches: 0,
    longestSession: 0,
    researchLoops: [],
    distractionLoops: [],
    communicationInterruptions: [],
    categoryBreakdown: {},
    timeline: []
  };
}
