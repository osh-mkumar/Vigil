import { useState, useEffect } from 'react';
import './App.css';

// Sample browser activity logs to demonstrate the analyzer
// In production, these would come from the Chrome extension
const SAMPLE_LOGS = [
  // Session starts: Development
  { timestamp: '2025-01-17T14:00:00Z', url: 'https://github.com/user/project', domain: 'github.com' },
  // Research Loop: Dev -> Docs -> Dev
  { timestamp: '2025-01-17T14:15:00Z', url: 'https://docs.python.org/3/library/json.html', domain: 'docs.python.org' },
  { timestamp: '2025-01-17T14:18:00Z', url: 'https://github.com/user/project', domain: 'github.com' },
  // Distraction Loop: Social -> Video -> Social
  { timestamp: '2025-01-17T14:30:00Z', url: 'https://twitter.com/home', domain: 'twitter.com' },
  { timestamp: '2025-01-17T14:32:00Z', url: 'https://youtube.com/watch?v=...', domain: 'youtube.com' },
  { timestamp: '2025-01-17T14:45:00Z', url: 'https://twitter.com/home', domain: 'twitter.com' },
  // Back to work
  { timestamp: '2025-01-17T14:50:00Z', url: 'https://notion.so/my-project', domain: 'notion.so' },
  { timestamp: '2025-01-17T15:20:00Z', url: 'https://github.com/user/project', domain: 'github.com' }
];

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // light by default

  // Check for analysis from Chrome extension via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const analysisParam = urlParams.get('analysis');

    if (analysisParam) {
      try {
        const analysisData = JSON.parse(decodeURIComponent(analysisParam));
        setAnalysis(analysisData);
        // Clean URL after loading
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err) {
        console.error('Failed to parse analysis from URL:', err);
      }
    }
  }, []);

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Apply site-wide dark class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  /**
   * Fetch analysis from backend
   * 
   * Why POST to /api/analyze instead of direct backend URL?
   * Vite's proxy prevents CORS issues during development.
   * In production, frontend and backend are on same origin.
   */
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Use /api prefix which Vite proxies to localhost:3001
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: SAMPLE_LOGS })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>VIGIL</h1>
        <p>Privacy-first browser attention analytics</p>

        {/* Theme Toggle */}
        <div className="theme-toggle">
          <button
            className="toggle-btn"
            onClick={() => setDarkMode((v) => !v)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </header>

      {/* Analysis Button */}
      <section className="controls">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? 'Analyzing Session...' : 'Analyze Session'}
        </button>
        {error && <p className="error">Error: {error}</p>}
      </section>

      {/* Results */}
      {analysis && (
        <div className="results">
          {/* Dashboard Metrics */}
          <section className="section dashboard-metrics">
            <h2>Session Analytics</h2>
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
              
              <div className="metric-card" style={{ padding: '16px', background: 'var(--card-bg, #fff)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '0.9em', color: 'var(--text-secondary, #666)', marginBottom: '8px' }}>Focus Score</h3>
                <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{analysis.focusScore || 0}/100</p>
              </div>

              <div className="metric-card" style={{ padding: '16px', background: 'var(--card-bg, #fff)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '0.9em', color: 'var(--text-secondary, #666)', marginBottom: '8px' }}>Deep Work Time</h3>
                <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{analysis.deepWorkTime || 0} min</p>
              </div>

              <div className="metric-card" style={{ padding: '16px', background: 'var(--card-bg, #fff)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '0.9em', color: 'var(--text-secondary, #666)', marginBottom: '8px' }}>Context Switches</h3>
                <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{analysis.contextSwitchCount || 0}</p>
              </div>

              <div className="metric-card" style={{ padding: '16px', background: 'var(--card-bg, #fff)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '0.9em', color: 'var(--text-secondary, #666)', marginBottom: '8px' }}>Longest Focus Session</h3>
                <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{analysis.longestFocusSession || 0} min</p>
              </div>

            </div>
          </section>

          {/* Loop Detection */}
          <section className="section">
            <h2>Loop Detection</h2>
            <div className="loops-list">
              {analysis.researchLoops && analysis.researchLoops.length > 0 && (
                <div className="loop-group">
                  <h3>Research Loops</h3>
                  {analysis.researchLoops.map((loop, idx) => (
                    <div key={idx} className="loop-card" style={{ borderLeft: '4px solid #10b981', padding: '12px', margin: '8px 0', background: 'var(--card-bg, #fff)', borderRadius: '4px' }}>
                      <span className="loop-domains">
                        {loop.domains.join(' ↔ ')}
                      </span>
                      <span className="loop-count" style={{ marginLeft: '12px', fontWeight: 'bold' }}>{loop.occurrences}x</span>
                    </div>
                  ))}
                </div>
              )}

              {analysis.distractionLoops && analysis.distractionLoops.length > 0 && (
                <div className="loop-group" style={{ marginTop: '16px' }}>
                  <h3>Distraction Loops</h3>
                  {analysis.distractionLoops.map((loop, idx) => (
                    <div key={idx} className="loop-card" style={{ borderLeft: '4px solid #ef4444', padding: '12px', margin: '8px 0', background: 'var(--card-bg, #fff)', borderRadius: '4px' }}>
                      <span className="loop-domains">
                        {loop.domains.join(' ↔ ')}
                      </span>
                      <span className="loop-count" style={{ marginLeft: '12px', fontWeight: 'bold' }}>{loop.occurrences}x</span>
                    </div>
                  ))}
                </div>
              )}

              {(!analysis.researchLoops?.length && !analysis.distractionLoops?.length) && (
                <p className="no-data">No loops detected in this session.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="empty-state">
          <p>Click "Analyze Session" to understand your focus patterns and context switching behaviors.</p>
          <p className="empty-state-hint">VIGIL will calculate your focus score, deep work time, and identify research or distraction loops.</p>
        </div>
      )}
    </div>
  );
}
