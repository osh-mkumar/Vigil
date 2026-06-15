import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Activity, 
  BrainCircuit, 
  Shuffle, 
  Clock, 
  ArrowRight,
  MessageSquareWarning,
  ZapOff,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { generateAnalytics, getUnclassifiedDomains } from './lib/analytics';
import './App.css';

// ==========================================
// MOCK DATA
// ==========================================
const MOCK_DATA = {
  focusScore: 84,
  deepWorkMinutes: 145,
  contextSwitches: 12,
  longestSession: 45,
  categoryBreakdown: {
    Development: 120,
    Documentation: 45,
    Communication: 30,
    Learning: 0,
    Social: 15,
    Video: 20,
    Entertainment: 0,
    Unknown: 10
  },
  researchLoops: [],
  communicationInterruptions: [],
  distractionLoops: [],
  timeline: []
};

const CATEGORY_COLORS = {
  Development: '#3F7A7D',
  Documentation: '#5A9497',
  Learning: '#72A8AB',
  Communication: '#627282',
  Social: '#8E444B',
  Video: '#A65D64',
  Entertainment: '#BE787F',
  Search: '#AAB8C2',
  Shopping: '#D4A373',
  Finance: '#CCD5AE',
  Productivity: '#8D99AE',
  Other: '#BDB2FF',
  Unknown: '#D5D2C9'
};

const AVAILABLE_CATEGORIES = [
  'Development', 'Learning', 'Documentation', 'Communication', 
  'Video', 'Social', 'Entertainment', 'Search', 
  'Shopping', 'Finance', 'Productivity', 'Other'
];

// ==========================================
// COMPONENTS
// ==========================================

function MetricCard({ title, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <Icon size={16} className="metric-icon" />
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function TimelineView({ timeline }) {
  const [selectedBlock, setSelectedBlock] = useState(null);
  if (!timeline || timeline.length === 0) return null;
  const totalDuration = timeline.reduce((acc, block) => acc + block.duration, 0);

  return (
    <div className="dashboard-row">
      <div className="section-title">Attention Timeline</div>
      <div className="timeline-card">
        <div className="timeline-bar-container">
          {timeline.map((block, idx) => (
            <div 
              key={idx} 
              className="timeline-block"
              title={`Domain: ${block.domain}\nCategory: ${block.category}\nStart: ${block.time}\nEnd: ${block.endTimeStr}\nDuration: ${block.duration}m`}
              onClick={() => setSelectedBlock(selectedBlock === block ? null : block)}
              style={{
                width: `${(block.duration / totalDuration) * 100}%`,
                backgroundColor: CATEGORY_COLORS[block.category] || CATEGORY_COLORS.Unknown,
                borderRight: idx < timeline.length - 1 ? '1px solid var(--bg-card)' : 'none',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
        <div className="timeline-labels">
          <span>{timeline[0].time}</span>
          <span>End of Session</span>
        </div>
      </div>
      
      {selectedBlock && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Session Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Domain</strong><span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selectedBlock.domain}</span></div>
            <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Category</strong><span style={{ color: CATEGORY_COLORS[selectedBlock.category] || CATEGORY_COLORS.Unknown, fontWeight: 500 }}>{selectedBlock.category}</span></div>
            <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Duration</strong><span style={{ color: 'var(--text-primary)' }}>{selectedBlock.duration}m</span></div>
            <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Start</strong><span style={{ color: 'var(--text-primary)' }}>{selectedBlock.time}</span></div>
            <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>End</strong><span style={{ color: 'var(--text-primary)' }}>{selectedBlock.endTimeStr}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBreakdown({ data }) {
  const chartData = Object.entries(data)
    .filter(([_, val]) => val > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dashboard-row">
      <div className="section-title">Category Breakdown</div>
      <div className="breakdown-card" style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
        
        <div style={{ width: '200px', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Unknown} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="breakdown-list" style={{ flex: 1 }}>
          {chartData.map((item) => (
            <div key={item.name} className="breakdown-item">
              <span className="breakdown-label">{item.name}</span>
              <div className="breakdown-bar-container">
                <div 
                  className="breakdown-bar" 
                  style={{ 
                    width: `${(item.value / chartData[0].value) * 100}%`,
                    backgroundColor: CATEGORY_COLORS[item.name] || CATEGORY_COLORS.Unknown
                  }}
                />
              </div>
              <span className="breakdown-value">{item.value}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResearchLoopCard({ loop }) {
  return (
    <div className="loop-card">
      <div className="loop-header">
        <span className="loop-type productive">Productive Loop</span>
        <div className="loop-stats">
          <span className="stat-badge"><Activity size={12} /> {loop.occurrences}x</span>
          <span className="stat-badge"><Clock size={12} /> {loop.totalDuration}m</span>
        </div>
      </div>
      <div className="loop-path">
        {loop.categories.map((cat, idx) => (
          <React.Fragment key={idx}>
            <div className="path-step">
              <span style={{ color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Unknown }}>●</span> {cat}
            </div>
            {idx < loop.categories.length - 1 && (
              <ArrowRight size={14} className="path-arrow" style={{ marginLeft: '6px' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DistractionLoopCard({ loop }) {
  return (
    <div className="loop-card">
      <div className="loop-header">
        <span className="loop-type distracting">{loop.loopType}</span>
        <div className="loop-stats">
          <span className="stat-badge"><Activity size={12} /> {loop.occurrences}x</span>
          <span className="stat-badge" style={{ color: 'var(--accent-distracting)' }}><Clock size={12} /> {loop.totalDuration}m lost</span>
        </div>
      </div>
      <div className="loop-path">
        {loop.categories.map((cat, idx) => (
          <React.Fragment key={idx}>
            <div className="path-step">
              <span style={{ color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Unknown }}>●</span> {cat}
            </div>
            {idx < loop.categories.length - 1 && (
              <ArrowRight size={14} className="path-arrow" style={{ marginLeft: '6px' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function CommunicationCard({ item }) {
  return (
    <div className="loop-card">
      <div className="loop-header">
        <span className="loop-type communication">Async Interruption</span>
        <div className="loop-stats">
          <span className="stat-badge"><Clock size={12} /> {item.duration}m lost</span>
        </div>
      </div>
      <div className="loop-path">
        <div className="path-step">
          <span style={{ color: CATEGORY_COLORS[item.interruptedCategory] || CATEGORY_COLORS.Unknown }}>●</span> {item.interruptedCategory}
        </div>
        <ArrowRight size={14} className="path-arrow" style={{ marginLeft: '6px' }} />
        <div className="path-step" style={{ color: 'var(--accent-communication)' }}>
          <MessageSquareWarning size={14} style={{ marginRight: '4px' }}/> Communication
        </div>
        <ArrowRight size={14} className="path-arrow" style={{ marginLeft: '6px' }} />
        <div className="path-step">
          <span style={{ color: CATEGORY_COLORS[item.interruptedCategory] || CATEGORY_COLORS.Unknown }}>●</span> {item.interruptedCategory}
        </div>
      </div>
    </div>
  );
}

function UnclassifiedDomains({ logs, userCategories, onCategorize }) {
  const unclassified = getUnclassifiedDomains(logs, userCategories);
  if (unclassified.length === 0) return null;

  return (
    <div className="dashboard-row">
      <div className="section-title">Unclassified Domains</div>
      <div className="unclassified-list">
        {unclassified.map(({ domain, timeSpentMinutes }) => (
          <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{domain}</span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{timeSpentMinutes}m</span>
              <select 
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                onChange={(e) => onCategorize(domain, e.target.value)} 
                defaultValue=""
              >
                <option value="" disabled>Categorize...</option>
                {AVAILABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ userCategories, onCategorize, onDelete }) {
  const domains = Object.keys(userCategories);

  return (
    <div className="dashboard-row">
      <div className="section-title">Custom Category Mappings</div>
      {domains.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No custom mappings yet. Unclassified domains will appear on the dashboard.</p>
      ) : (
        <div className="settings-list">
          {domains.map((domain) => (
            <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{domain}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  value={userCategories[domain]} 
                  onChange={(e) => onCategorize(domain, e.target.value)}
                >
                  {AVAILABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  onClick={() => onDelete(domain)} 
                  style={{ padding: '4px 8px', color: 'var(--accent-distracting)', cursor: 'pointer', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DebugPanel({ logs }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!logs || logs.length === 0) return null;

  return (
    <div className="dashboard-row" style={{ marginTop: '48px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', width: '100%', justifyContent: 'space-between' }}
      >
        <span>Analytics Debug</span>
        <span>{isOpen ? 'Collapse ▲' : 'Expand ▼'}</span>
      </button>
      
      {isOpen && (
        <div style={{ marginTop: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Domain</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Duration</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Classified By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{log.domain}</td>
                  <td style={{ padding: '12px', color: CATEGORY_COLORS[log.category] || CATEGORY_COLORS.Unknown, fontWeight: 500 }}>{log.category}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{log.durationMinutes}m</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{log.classifiedBy || 'Unknown Engine'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HealthCheckView({ data }) {
  if (!data) return null;
  return (
    <div className="dashboard-row">
      <div className="section-title">Dashboard Health Check</div>
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-primary)' }}>
          <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><strong>Research Loops Count:</strong> {data.researchLoops.length}</li>
          <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><strong>Communication Interruptions Count:</strong> {data.communicationInterruptions.length}</li>
          <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}><strong>Distraction Spirals Count:</strong> {data.distractionLoops.length}</li>
          <li style={{ padding: '8px 0' }}><strong>Timeline Segments Count:</strong> {data.timeline.length}</li>
        </ul>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const [logs, setLogs] = useState([]);
  const [userCategories, setUserCategories] = useState({});
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'settings'

  useEffect(() => {
    async function loadData() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const res = await chrome.storage.local.get(['logs', 'userCategories']);
          const loadedLogs = res.logs || [];
          const loadedCategories = res.userCategories || {};
          
          setLogs(loadedLogs);
          setUserCategories(loadedCategories);
          
          if (loadedLogs.length === 0) {
            setData(null);
          } else {
            const analytics = generateAnalytics(loadedLogs, loadedCategories);
            setData(analytics);
            console.log("Analytics Output", analytics);
          }
        } else {
          // Dev fallback
          setData(MOCK_DATA);
          console.log("Analytics Output", MOCK_DATA);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleCategorize(domain, category) {
    const newCategories = { ...userCategories, [domain]: category };
    setUserCategories(newCategories);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userCategories: newCategories });
    }
    if (logs.length > 0) {
      const analytics = generateAnalytics(logs, newCategories);
      setData(analytics);
      console.log("Analytics Output", analytics);
    }
  }

  async function handleDeleteCategory(domain) {
    const newCategories = { ...userCategories };
    delete newCategories[domain];
    setUserCategories(newCategories);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userCategories: newCategories });
    }
    if (logs.length > 0) {
      const analytics = generateAnalytics(logs, newCategories);
      setData(analytics);
      console.log("Analytics Output", analytics);
    }
  }

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading VIGIL Analytics...
      </div>
    );
  }

  if (!data && view !== 'settings') {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <ZapOff size={48} color="var(--text-muted)" />
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>No Activity Recorded</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Browse a few tabs while tracking is active to see your insights.</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="header-title">
            <h1>VIGIL</h1>
            <p>Understand where your attention goes.</p>
          </div>
          {view === 'dashboard' && (
            <div className="date-selector" style={{ marginTop: '16px' }}>
              <button className="date-btn active">Today</button>
              <button className="date-btn">This Week</button>
              <button className="date-btn">This Month</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setView(view === 'healthCheck' ? 'dashboard' : 'healthCheck')}
            style={{ background: 'none', border: 'none', color: view === 'healthCheck' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
            title="Health Check"
          >
            <ShieldCheck size={20} />
          </button>
          <button 
            onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
            style={{ background: 'none', border: 'none', color: view === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
            title="Category Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {view === 'settings' ? (
        <SettingsView 
          userCategories={userCategories} 
          onCategorize={handleCategorize} 
          onDelete={handleDeleteCategory} 
        />
      ) : view === 'healthCheck' ? (
        <HealthCheckView data={data} />
      ) : (
        <>
          {/* ROW 1 */}
          <div className="dashboard-row">
            <div className="section-title">Session Metrics</div>
            <div className="metrics-grid">
              <MetricCard title="Focus Score" value={`${data.focusScore}/100`} icon={Activity} />
              <MetricCard title="Deep Work" value={`${data.deepWorkMinutes}m`} icon={BrainCircuit} />
              <MetricCard title="Context Switches" value={data.contextSwitches} icon={Shuffle} />
              <MetricCard title="Longest Session" value={`${data.longestSession}m`} icon={Clock} />
            </div>
          </div>

          {/* ROW 2 */}
          <TimelineView timeline={data.timeline} />

          {/* ROW 3 */}
          <CategoryBreakdown data={data.categoryBreakdown} />

          {/* ROW 4 */}
          <div className="dashboard-row">
            <div className="section-title">Research Loops</div>
            {data.researchLoops.length > 0 ? (
              <div className="loops-grid">
                {data.researchLoops.map((loop, i) => <ResearchLoopCard key={i} loop={loop} />)}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No research loops detected today.</p>
            )}
          </div>

          {/* ROW 5 */}
          <div className="dashboard-row">
            <div className="section-title">Communication Interruptions</div>
            {data.communicationInterruptions.length > 0 ? (
              <div className="loops-grid">
                {data.communicationInterruptions.map((item, i) => <CommunicationCard key={i} item={item} />)}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No communication interruptions detected today.</p>
            )}
          </div>

          {/* ROW 6 */}
          <div className="dashboard-row">
            <div className="section-title">Distraction Spirals</div>
            {data.distractionLoops.length > 0 ? (
              <div className="loops-grid">
                {data.distractionLoops.map((loop, i) => <DistractionLoopCard key={i} loop={loop} />)}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No distraction spirals detected today.</p>
            )}
          </div>

          {/* ROW 7 */}
          <UnclassifiedDomains 
            logs={logs} 
            userCategories={userCategories} 
            onCategorize={handleCategorize} 
          />

          {/* ROW 8: DEBUG */}
          {data.rawLogs && <DebugPanel logs={data.rawLogs} />}
        </>
      )}

    </div>
  );
}
