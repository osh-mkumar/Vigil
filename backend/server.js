import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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
    const logs = Array.isArray(req.body)
      ? req.body
      : req.body?.logs;

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

    // Generate static analysis based on new VIGIL metrics
    // In the future, this is where rule-based or optional ML logic will live
    console.log('📊 Returning VIGIL metrics');
    return res.status(200).json({
      focusScore: 78,
      deepWorkTime: 45,
      contextSwitchCount: 12,
      longestFocusSession: 25,
      researchLoops: [
        {
          domains: ['github.com', 'stackoverflow.com'],
          occurrences: 4
        }
      ],
      distractionLoops: [
        {
          domains: ['twitter.com', 'news.ycombinator.com'],
          occurrences: 2
        }
      ]
    });

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
  console.log(`✓ VIGIL Backend running on http://localhost:${PORT}`);
});
