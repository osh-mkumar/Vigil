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
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import { generateAnalytics, getUnclassifiedDomains, generateDailySummaries, aggregateSummaries, getSampleAnalytics } from './lib/analytics';
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

function PreviewBanner({ timeRange }) {
  const isWeek = timeRange === 'week';
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <span style={{ backgroundColor: 'var(--accent-primary)', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview Mode</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        Showing sample data. Use Vigil for {isWeek ? 'a few days' : 'several weeks'} to unlock personalized {isWeek ? 'weekly' : 'monthly'} insights.
      </span>
    </div>
  );
}

function EducationalCard({ title, children }) {
  return (
    <div className="loop-card" style={{ backgroundColor: '#FDFCF9', borderStyle: 'dashed' }}>
      <div className="loop-header" style={{ marginBottom: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Info size={14} /> {title}
        </span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        {children}
      </p>
    </div>
  );
}

function TimelineView({ timeline, timeRange }) {
  const [selectedBlock, setSelectedBlock] = useState(null);
  if (timeRange !== 'today') return null;
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
          <span className="stat-badge"><Activity size={12} /> {item.occurrences || 1}x</span>
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

function DebugPanel({ logs, dailySummaries }) {
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
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px' }}>Stored Daily Summaries</h4>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Focus Score</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Deep Work</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Context Switches</th>
                  </tr>
                </thead>
                <tbody>
                  {(!dailySummaries || dailySummaries.length === 0) ? (
                    <tr><td colSpan="4" style={{ padding: '12px', color: 'var(--text-secondary)' }}>No daily summaries stored.</td></tr>
                  ) : dailySummaries.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.date}</td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{s.focusScore}</td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{s.deepWorkMinutes}m</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.contextSwitches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px' }}>Raw Session Logs (Today)</h4>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
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
          </div>
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
// ATTENTION CALENDAR
// ==========================================

function AttentionCalendar({ dailySummaries }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const today = new Date();
  const days = [];
  
  const useSampleData = dailySummaries.length < 7;
  const formatDate = (date) => date.toLocaleDateString('en-CA');
  
  const summaryMap = {};
  if (useSampleData) {
    for (let i = 0; i < 84; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isWorking = !isWeekend && Math.random() > 0.1;
      
      if (isWorking) {
        summaryMap[dateStr] = {
          date: dateStr,
          focusScore: Math.floor(Math.random() * 80) + 20,
          deepWorkMinutes: Math.floor(Math.random() * 180) + 30,
          contextSwitches: Math.floor(Math.random() * 30) + 5,
          researchLoops: Math.floor(Math.random() * 5)
        };
      }
    }
  } else {
    dailySummaries.forEach(s => {
      summaryMap[s.date] = s;
    });
  }

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    
    const s = summaryMap[dateStr];
    days.push({
      date: dateStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      data: s || null
    });
  }
  
  const getColorClass = (score) => {
    if (score === undefined || score === null) return 'calendar-day-empty';
    if (score <= 40) return 'calendar-day-low';
    if (score <= 70) return 'calendar-day-medium';
    return 'calendar-day-high';
  };

  return (
    <div className="dashboard-row">
      <div className="section-title">Attention Calendar</div>
      <div className="calendar-card">
        <div className="calendar-header">
          <div className="calendar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Focus History
            {useSampleData && (
              <span style={{ backgroundColor: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Data</span>
            )}
          </div>
        </div>
        
        <div className="calendar-grid">
          {days.map((day, idx) => (
            <div 
              key={idx} 
              className={`calendar-day ${getColorClass(day.data?.focusScore)}`}
              onClick={() => day.data && setSelectedDay(day)}
            >
              {day.data && (
                <div className="calendar-tooltip">
                  <div className="tooltip-header">{day.displayDate}</div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Focus Score</span>
                    <span className="tooltip-value">{day.data.focusScore}</span>
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Deep Work</span>
                    <span className="tooltip-value">{day.data.deepWorkMinutes}m</span>
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Switches</span>
                    <span className="tooltip-value">{day.data.contextSwitches}</span>
                  </div>
                  <div className="tooltip-row">
                    <span className="tooltip-label">Research Loops</span>
                    <span className="tooltip-value">{day.data.researchLoops || 0}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="calendar-legend">
          <span>Less Focus</span>
          <div className="legend-squares">
            <div className="legend-square calendar-day-low"></div>
            <div className="legend-square calendar-day-medium"></div>
            <div className="legend-square calendar-day-high"></div>
          </div>
          <span>More Focus</span>
        </div>
      </div>

      {selectedDay && selectedDay.data && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <X 
              className="modal-close" 
              size={24} 
              onClick={() => setSelectedDay(null)} 
            />
            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {selectedDay.displayDate}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Daily Focus Summary
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <MetricCard title="Focus Score" value={`${selectedDay.data.focusScore}/100`} icon={Activity} />
              <MetricCard title="Deep Work" value={`${selectedDay.data.deepWorkMinutes}m`} icon={BrainCircuit} />
              <MetricCard title="Context Switches" value={selectedDay.data.contextSwitches} icon={Shuffle} />
              <MetricCard title="Research Loops" value={selectedDay.data.researchLoops || 0} icon={Clock} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const [logs, setLogs] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [userCategories, setUserCategories] = useState({});
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'settings' | 'healthCheck'
  const [timeRange, setTimeRange] = useState('today'); // 'today' | 'week' | 'month'
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const res = await chrome.storage.local.get(['logs', 'userCategories', 'dailySummaries']);
          const loadedLogs = res.logs || [];
          const loadedCategories = res.userCategories || {};
          let loadedSummaries = res.dailySummaries || [];
          
          setLogs(loadedLogs);
          setUserCategories(loadedCategories);
          
          // Generate any missing summaries for past days
          if (loadedLogs.length > 0) {
            const newSummaries = generateDailySummaries(loadedLogs, loadedSummaries, loadedCategories);
            if (newSummaries.length > 0) {
              loadedSummaries = [...loadedSummaries, ...newSummaries];
              await chrome.storage.local.set({ dailySummaries: loadedSummaries });
              console.log('✓ Generated new daily summaries:', newSummaries);
            }
          }
          setDailySummaries(loadedSummaries);
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

  useEffect(() => {
    if (isLoading) return;
    
    setIsPreviewMode(false);
    
    if (timeRange === 'today') {
      const todayDate = new Date().toLocaleDateString('en-CA');
      const todaysLogs = logs.filter(l => {
        if (!l.startTime) return false;
        return new Date(l.startTime).toLocaleDateString('en-CA') === todayDate;
      });
      if (todaysLogs.length === 0) {
        setData(null);
      } else {
        const analytics = generateAnalytics(todaysLogs, userCategories);
        setData(analytics);
      }
    } else {
      const days = timeRange === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toLocaleDateString('en-CA');
      
      const relevantSummaries = dailySummaries.filter(s => s.date >= cutoffStr);
      
      if (timeRange === 'week' && relevantSummaries.length < 7) {
        setIsPreviewMode(true);
        setData(getSampleAnalytics('week'));
      } else if (timeRange === 'month' && relevantSummaries.length < 14) {
        setIsPreviewMode(true);
        setData(getSampleAnalytics('month'));
      } else if (relevantSummaries.length === 0) {
        setData(null);
      } else {
        const analytics = aggregateSummaries(relevantSummaries);
        setData(analytics);
      }
    }
  }, [timeRange, logs, dailySummaries, userCategories, isLoading]);

  async function handleCategorize(domain, category) {
    const newCategories = { ...userCategories, [domain]: category };
    setUserCategories(newCategories);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userCategories: newCategories });
    }
  }

  async function handleDeleteCategory(domain) {
    const newCategories = { ...userCategories };
    delete newCategories[domain];
    setUserCategories(newCategories);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userCategories: newCategories });
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
              <button 
                className={`date-btn ${timeRange === 'today' ? 'active' : ''}`}
                onClick={() => setTimeRange('today')}
              >Today</button>
              <button 
                className={`date-btn ${timeRange === 'week' ? 'active' : ''}`}
                onClick={() => setTimeRange('week')}
              >This Week</button>
              <button 
                className={`date-btn ${timeRange === 'month' ? 'active' : ''}`}
                onClick={() => setTimeRange('month')}
              >This Month</button>
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
          {isPreviewMode && <PreviewBanner timeRange={timeRange} />}
          
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

          <AttentionCalendar dailySummaries={dailySummaries} />

          {/* ROW 2 */}
          <TimelineView timeline={data.timeline} timeRange={timeRange} />

          {/* ROW 3 */}
          <CategoryBreakdown data={data.categoryBreakdown} />

          {/* ROW 4 */}
          <div className="dashboard-row">
            <div className="section-title">Research Loops</div>
            {data.researchLoops.length > 0 ? (
              <div className="loops-grid">
                <EducationalCard title="Cognitive Science">
                  <strong>Productive Context Switching.</strong> Switching between Development and Documentation represents healthy problem-solving loops, not distractions. Vigil rewards these transitions rather than penalizing them.
                </EducationalCard>
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
                <EducationalCard title="Focus Cost">
                  <strong>Async Checking.</strong> Briefly opening email or chat during deep work fundamentally disrupts cognitive flow. It takes an average of 23 minutes to fully regain deep focus after a communication check.
                </EducationalCard>
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
                <EducationalCard title="Behavioral Patterns">
                  <strong>Cascading Distractions.</strong> A Distraction Spiral occurs when you chain multiple distracting sites together (e.g., Social Media → Video → Entertainment), creating a compounding loss of focus.
                </EducationalCard>
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
          <DebugPanel logs={data.rawLogs || []} dailySummaries={dailySummaries} />
        </>
      )}

    </div>
  );
}
