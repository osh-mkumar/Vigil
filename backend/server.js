import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateAnalytics } from './analytics.js';

// ========================================
// 1. LOAD ENVIRONMENT VARIABLES
// ========================================
dotenv.config();

// ========================================
// 2. CREATE EXPRESS APP
// ========================================
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// 3. MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========================================
// 4. ROUTES
// ========================================

app.post('/analyze', async (req, res) => {
  console.log('✅ /analyze HIT');

  try {
    const logs = Array.isArray(req.body) ? req.body : req.body?.logs;

    if (!Array.isArray(logs) || logs.length === 0) {
      console.warn('⚠️ No valid logs received');
      return res.status(200).json({
        focusScore: 0,
        deepWorkTime: 0,
        contextSwitchCount: 0,
        longestFocusSession: 0,
        researchLoops: [],
        distractionLoops: [],
        is_fallback: true
      });
    }

    const formattedLogs = logs.map(log => ({
      timestamp: log.timestamp,
      domain: log.domain || extractDomain(log.url)
    }));

    // Process logs through our local VIGIL analytics engine
    const analysisResults = generateAnalytics(formattedLogs);

    console.log('📊 Generated VIGIL Analytics Data');
    return res.status(200).json(analysisResults);

  } catch (error) {
    console.error('🔥 /analyze fatal error:', error);
    return res.status(500).json({
      error: 'An internal error occurred during analysis.'
    });
  }
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// 5. HELPERS
// ========================================

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

// ========================================
// 6. START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`✓ VIGIL Analytics Backend running on http://localhost:${PORT}`);
});
