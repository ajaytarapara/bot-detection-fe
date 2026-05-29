import { useReducer, useEffect, useRef, useState, useMemo } from 'react';

// --- TYPES ---
export type BotAction = 'Allow' | 'Shadow' | 'Challenge' | 'Throttle' | 'Block' | 'Tarpit';

export interface BotEvent {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  endpoint: string;
  action: BotAction;
  score: number;
  reason: string;
  latencyMs: number;
  userAgent: string;
}

export interface DashboardStats {
  totalRequests: number;
  allowCount: number;
  shadowCount: number;
  challengeCount: number;
  throttleCount: number;
  blockCount: number;
  tarpitCount: number;
  totalLatencyMs: number;
  ruleCounts: Record<string, number>;
}

interface MonitorState {
  events: BotEvent[];
  queuedEvents: BotEvent[];
  isPaused: boolean;
  activeSimulator: string;
  stats: DashboardStats;
}

type MonitorAction =
  | { type: 'ADD_EVENT'; payload: BotEvent }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'FLUSH_QUEUE' }
  | { type: 'SET_SIMULATOR'; payload: string }
  | { type: 'RESET_STATS' };

// --- INITIAL STATE & REDUCER ---
const initialStats: DashboardStats = {
  totalRequests: 0,
  allowCount: 0,
  shadowCount: 0,
  challengeCount: 0,
  throttleCount: 0,
  blockCount: 0,
  tarpitCount: 0,
  totalLatencyMs: 0,
  ruleCounts: {},
};

const initialState: MonitorState = {
  events: [],
  queuedEvents: [],
  isPaused: false,
  activeSimulator: 'mix',
  stats: initialStats,
};

function updateStats(stats: DashboardStats, event: BotEvent): DashboardStats {
  const nextStats = { ...stats };
  nextStats.totalRequests += 1;
  nextStats.totalLatencyMs += event.latencyMs;

  switch (event.action) {
    case 'Allow': nextStats.allowCount += 1; break;
    case 'Shadow': nextStats.shadowCount += 1; break;
    case 'Challenge': nextStats.challengeCount += 1; break;
    case 'Throttle': nextStats.throttleCount += 1; break;
    case 'Block': nextStats.blockCount += 1; break;
    case 'Tarpit': nextStats.tarpitCount += 1; break;
  }

  if (event.reason && event.reason !== 'Passed all rules') {
    nextStats.ruleCounts[event.reason] = (nextStats.ruleCounts[event.reason] || 0) + 1;
  }

  return nextStats;
}

function monitorReducer(state: MonitorState, action: MonitorAction): MonitorState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const updatedStats = updateStats(state.stats, action.payload);
      
      if (state.isPaused) {
        return {
          ...state,
          queuedEvents: [action.payload, ...state.queuedEvents],
          stats: updatedStats,
        };
      } else {
        return {
          ...state,
          events: [action.payload, ...state.events].slice(0, 50),
          stats: updatedStats,
        };
      }
    }
    case 'SET_PAUSED': {
      if (action.payload === state.isPaused) return state;

      if (!action.payload && state.queuedEvents.length > 0) {
        // Flushing queue when unpausing
        const newEvents = [...state.queuedEvents, ...state.events].slice(0, 50);
        return {
          ...state,
          isPaused: false,
          events: newEvents,
          queuedEvents: [],
        };
      }

      return {
        ...state,
        isPaused: action.payload,
      };
    }
    case 'FLUSH_QUEUE': {
      if (state.queuedEvents.length === 0) return state;
      return {
        ...state,
        events: [...state.queuedEvents, ...state.events].slice(0, 50),
        queuedEvents: [],
      };
    }
    case 'SET_SIMULATOR': {
      return {
        ...state,
        activeSimulator: action.payload,
      };
    }
    case 'RESET_STATS': {
      return {
        ...state,
        stats: { ...initialStats },
        events: [],
        queuedEvents: [],
      };
    }
    default:
      return state;
  }
}

// --- MOCK GENERATOR UTILS ---
const USER_AGENTS_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
  'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/120.0'
];

const BOT_USER_AGENTS = ['python-requests/2.31.0', 'curl/8.4.0', 'Scrapy/2.11.0', 'Go-http-client/1.1', 'Wget/1.21.4'];
const VERIFIED_BOTS = ['Googlebot/2.1 (+http://www.google.com/bot.html)', 'Bingbot/2.0 (+http://www.bing.com/bingbot.htm)'];
const ENDPOINTS = ['/api/products', '/api/products/847', '/api/search', '/api/prices/847', '/api/login', '/health'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomEvent(mode: string): BotEvent {
  const id = Math.random().toString(36).substring(2, 9);
  const now = new Date();
  const timestamp = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');

  let ip = `${Math.floor(Math.random() * 150 + 50)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
  let method = 'GET';
  let endpoint = getRandomElement(ENDPOINTS);
  let action: BotAction = 'Allow';
  let score = Math.floor(Math.random() * 20); // standard low score
  let reason = 'Passed all rules';
  let latencyMs = Math.floor(Math.random() * 4) + 1; // 1-4ms
  let userAgent = getRandomElement(USER_AGENTS_POOL);

  // Apply scenario characteristics
  const scenario = mode === 'mix' ? getRandomElement(['legit', 'naive', 'scraper', 'rotating', 'distributed', 'credential']) : mode;

  switch (scenario) {
    case 'naive':
      ip = '203.0.113.88';
      method = 'GET';
      endpoint = '/api/products';
      userAgent = ''; // No UA
      action = 'Block';
      score = 95;
      reason = 'Missing User-Agent';
      break;

    case 'scraper':
      ip = '198.51.100.12';
      method = 'GET';
      endpoint = getRandomElement(['/api/prices/432', '/api/products/847']);
      userAgent = getRandomElement(BOT_USER_AGENTS);
      action = 'Throttle';
      score = 75;
      reason = 'Suspicious User-Agent, Rate limit exceeded';
      break;

    case 'rotating':
      ip = '192.0.2.45'; // Same IP
      method = 'GET';
      endpoint = '/api/products';
      userAgent = getRandomElement(BOT_USER_AGENTS.concat(USER_AGENTS_POOL)); // Rotating UAs
      action = 'Block';
      score = 90;
      reason = 'Global IP rate limit exceeded (NAT threshold)';
      break;

    case 'distributed':
      // Randomized IP, but requesting rapidly
      ip = `${Math.floor(Math.random() * 220 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      method = 'GET';
      endpoint = '/api/search';
      latencyMs = Math.floor(Math.random() * 400) + 100; // Search has artificial delay (100-500ms)
      userAgent = getRandomElement(USER_AGENTS_POOL);
      action = 'Shadow';
      score = 45;
      reason = 'Search endpoint spike (Shadow tracking)';
      break;

    case 'credential':
      ip = '198.51.100.99';
      method = 'POST';
      endpoint = '/api/login';
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
      action = 'Tarpit';
      score = 100;
      reason = 'Brute force credential stuffing';
      latencyMs = 5000; // Tarpit introduces 5s delay
      break;

    case 'legit':
    default:
      // Random API Partner or Human Web User
      const isPartner = Math.random() > 0.7;
      const isVerifiedBot = Math.random() > 0.85;

      if (isVerifiedBot) {
        userAgent = getRandomElement(VERIFIED_BOTS);
        endpoint = '/api/products';
        action = 'Allow';
        score = 0;
        reason = 'Verified Googlebot/Bingbot via DNS reverse lookup';
      } else if (isPartner) {
        endpoint = '/api/products';
        action = 'Allow';
        score = 0;
        reason = 'Bypassed - Trusted API Key';
      } else {
        // Human
        if (endpoint === '/health') {
          action = 'Allow';
          score = 0;
          reason = 'Bypassed whitelisted path';
        } else {
          action = 'Allow';
          score = Math.floor(Math.random() * 25);
          reason = 'Passed all rules';
        }
      }
      break;
  }

  // Helper to mask IP address
  const maskIp = (rawIp: string) => {
    const parts = rawIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return rawIp;
  };

  return {
    id,
    timestamp,
    ip: maskIp(ip),
    method,
    endpoint,
    action,
    score,
    reason,
    latencyMs,
    userAgent,
  };
}

// --- MAIN COMPONENT ---
export default function BotActivityMonitor() {
  const [state, dispatch] = useReducer(monitorReducer, initialState);
  const [speed, setSpeed] = useState(300); // ms per event (simulate 3 events/sec)
  const hoverContainerRef = useRef<HTMLDivElement>(null);

  // Computed values
  const blockRate = useMemo(() => {
    if (state.stats.totalRequests === 0) return 0;
    const mitigated = state.stats.blockCount + state.stats.challengeCount + state.stats.throttleCount + state.stats.tarpitCount;
    return Math.round((mitigated / state.stats.totalRequests) * 100);
  }, [state.stats]);

  const avgLatency = useMemo(() => {
    if (state.stats.totalRequests === 0) return 0;
    // Exclude tarpits from normal overhead calculation to avoid skewed display
    const nonTarpitRequests = state.stats.totalRequests - state.stats.tarpitCount;
    if (nonTarpitRequests <= 0) return 5000;
    const nonTarpitLatency = state.stats.totalLatencyMs - (state.stats.tarpitCount * 5000);
    return parseFloat((nonTarpitLatency / nonTarpitRequests).toFixed(2));
  }, [state.stats]);

  const topRule = useMemo(() => {
    const rules = state.stats.ruleCounts;
    let maxRule = 'None';
    let maxCount = 0;
    for (const [rule, count] of Object.entries(rules)) {
      if (count > maxCount) {
        maxCount = count;
        maxRule = rule;
      }
    }
    return maxCount > 0 ? `${maxRule} (${maxCount})` : 'None';
  }, [state.stats.ruleCounts]);

  const threatLevel = useMemo(() => {
    if (blockRate > 60) return { label: 'CRITICAL ATTACK', color: 'text-red-500 border-red-500 bg-red-950/30' };
    if (blockRate > 30) return { label: 'ELEVATED RISK', color: 'text-orange-500 border-orange-500 bg-orange-950/30' };
    if (blockRate > 10) return { label: 'MODERATE ACTIVITY', color: 'text-yellow-500 border-yellow-500 bg-yellow-950/30' };
    return { label: 'SECURE', color: 'text-green-500 border-green-500 bg-green-950/30' };
  }, [blockRate]);

  // Live Simulator Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateRandomEvent(state.activeSimulator);
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
    }, speed);

    return () => clearInterval(interval);
  }, [speed, state.activeSimulator]);

  // Handle hover pauses
  const handleMouseEnter = () => {
    dispatch({ type: 'SET_PAUSED', payload: true });
  };

  const handleMouseLeave = () => {
    dispatch({ type: 'SET_PAUSED', payload: false });
  };

  const getActionBadgeClass = (action: BotAction) => {
    switch (action) {
      case 'Block':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'Tarpit':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'Throttle':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'Challenge':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      case 'Shadow':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Allow':
      default:
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-50 via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              ANTIGRAVITY BOT SHIELD
            </h1>
            <p className="text-xs text-slate-500">Real-time Bot Detection & Mitigation Control Dashboard</p>
          </div>
        </div>

        {/* Threat Pulser */}
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wider ${threatLevel.color} transition-all duration-300 animate-pulse`}>
          STATUS: {threatLevel.label}
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* LEFT COLUMN: METRICS & SIMULATOR CONTROLS */}
        <div className="space-y-6 lg:col-span-1 flex flex-col">
          
          {/* STATS CARD */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 space-y-6">
            <h2 className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Live Performance (Rolling)</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
                <span className="text-xs text-slate-500 block mb-1">Total Requests</span>
                <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">{state.stats.totalRequests.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
                <span className="text-xs text-slate-500 block mb-1">Mitigation Rate</span>
                <span className={`text-2xl font-bold font-mono tracking-tight ${blockRate > 40 ? 'text-red-400' : 'text-emerald-400'}`}>{blockRate}%</span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
                <span className="text-xs text-slate-500 block mb-1">Avg Middleware Latency</span>
                <span className="text-2xl font-bold font-mono tracking-tight text-indigo-400">{avgLatency} ms</span>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
                <span className="text-xs text-slate-500 block mb-1">Tarpitted Requests</span>
                <span className="text-2xl font-bold font-mono tracking-tight text-purple-400">{state.stats.tarpitCount}</span>
              </div>
            </div>

            {/* ACTION SPLIT BAR */}
            <div className="space-y-2">
              <span className="text-xs text-slate-500 block">Mitigation Response Breakdown</span>
              <div className="h-3 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-900">
                {state.stats.totalRequests === 0 ? (
                  <div className="h-full w-full bg-slate-800" />
                ) : (
                  <>
                    <div style={{ width: `${(state.stats.allowCount / state.stats.totalRequests) * 100}%` }} className="bg-emerald-500 transition-all duration-300" title="Allow" />
                    <div style={{ width: `${(state.stats.shadowCount / state.stats.totalRequests) * 100}%` }} className="bg-blue-500 transition-all duration-300" title="Shadow" />
                    <div style={{ width: `${(state.stats.challengeCount / state.stats.totalRequests) * 100}%` }} className="bg-yellow-500 transition-all duration-300" title="Challenge" />
                    <div style={{ width: `${(state.stats.throttleCount / state.stats.totalRequests) * 100}%` }} className="bg-orange-500 transition-all duration-300" title="Throttle" />
                    <div style={{ width: `${(state.stats.blockCount / state.stats.totalRequests) * 100}%` }} className="bg-red-500 transition-all duration-300" title="Block" />
                    <div style={{ width: `${(state.stats.tarpitCount / state.stats.totalRequests) * 100}%` }} className="bg-purple-600 transition-all duration-300" title="Tarpit" />
                  </>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Allow: {state.stats.allowCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span> Shadow: {state.stats.shadowCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block"></span> Challenge: {state.stats.challengeCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block"></span> Throttle: {state.stats.throttleCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Block: {state.stats.blockCount}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600 inline-block"></span> Tarpit: {state.stats.tarpitCount}</span>
              </div>
            </div>

            {/* TOP TRIGGERED RULE */}
            <div className="border-t border-slate-900 pt-4">
              <span className="text-xs text-slate-500 block mb-1">Top Triggered Rule</span>
              <span className="text-sm font-semibold text-slate-300 font-mono break-words block bg-slate-950/40 p-3 rounded-lg border border-slate-900/60">
                {topRule}
              </span>
            </div>
          </div>

          {/* SIMULATOR CONTROLS CARD */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Bot Stream Simulator</h2>
                <button 
                  onClick={() => dispatch({ type: 'RESET_STATS' })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Clear Feed
                </button>
              </div>

              {/* SIMULATOR MODES */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 block">Select Attack Scenario</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mix', label: 'All Traffic Mix' },
                    { id: 'legit', label: 'Legitimate Traffic' },
                    { id: 'naive', label: 'Naive Bot (100 req/s)' },
                    { id: 'scraper', label: 'Basic Scraper (Python)' },
                    { id: 'rotating', label: 'Rotating UAs (IP NAT)' },
                    { id: 'distributed', label: 'Distributed (100+ IPs)' },
                    { id: 'credential', label: 'Credential Stuffing' },
                  ].map((sim) => (
                    <button
                      key={sim.id}
                      onClick={() => dispatch({ type: 'SET_SIMULATOR', payload: sim.id })}
                      className={`text-left px-3 py-2.5 rounded-xl text-xs border transition-all ${
                        state.activeSimulator === sim.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                          : 'border-slate-900 bg-slate-950/20 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      {sim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SPEED SLIDER */}
            <div className="space-y-3 border-t border-slate-900 pt-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Stream Frequency</span>
                <span className="text-indigo-400 font-mono">{(1000 / speed).toFixed(1)} req/sec</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Fast (20 req/s)</span>
                <span>Slow (1 req/s)</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: EVENT FEED (Takes 2 grid columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col h-[750px] lg:h-auto">
          
          {/* FEED PANEL */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col h-full overflow-hidden relative">
            
            {/* Feed Header */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Live Activity Stream</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  STABILIZED
                </div>
              </div>
              <span className="text-xs text-slate-500">Showing last 50 events</span>
            </div>

            {/* Pause Notification Overlay Banner */}
            {state.isPaused && (
              <div className="absolute top-16 left-6 right-6 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl flex justify-between items-center text-xs text-indigo-300 z-10 animate-fade-in backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Feed paused on hover. Reading logs...</span>
                </div>
                <span className="font-mono bg-indigo-500/25 px-2 py-0.5 rounded text-[10px]">
                  {state.queuedEvents.length} events queued
                </span>
              </div>
            )}

            {/* EVENT LIST WINDOW */}
            <div
              ref={hoverContainerRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className={`flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar transition-all duration-300 ${
                state.isPaused ? 'pt-14' : ''
              }`}
            >
              {state.events.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-slate-600 py-20 space-y-2">
                  <svg className="w-12 h-12 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <p className="text-sm font-medium">Waiting for incoming traffic stream...</p>
                </div>
              ) : (
                state.events.map((event) => (
                  <div
                    key={event.id}
                    className="group bg-slate-950/40 hover:bg-slate-950/80 rounded-xl p-3.5 border border-slate-900/60 hover:border-slate-800 transition-all duration-150 grid grid-cols-1 md:grid-cols-4 items-center gap-4 text-xs font-mono relative overflow-hidden"
                  >
                    {/* Timestamp & IP */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block">{event.timestamp}</span>
                      <span className="text-slate-300 font-semibold tracking-wider block">{event.ip}</span>
                    </div>

                    {/* Method & Path */}
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          event.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {event.method}
                        </span>
                        <span className="text-slate-200 font-medium truncate inline-block max-w-[200px]" title={event.endpoint}>
                          {event.endpoint}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate group-hover:text-slate-400 transition-colors" title={event.userAgent}>
                        {event.userAgent || '<no user-agent>'}
                      </span>
                    </div>

                    {/* Action badge & Score / Reason */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-center tracking-wide min-w-[75px] block ${getActionBadgeClass(event.action)}`}>
                        {event.action.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block group-hover:text-slate-400 truncate max-w-[150px]" title={event.reason}>
                          {event.reason}
                        </span>
                        <span className="text-[9px] text-slate-600 block">
                          Score: <span className={event.score > 50 ? 'text-red-400' : 'text-slate-500'}>{event.score}</span> | {event.latencyMs}ms
                        </span>
                      </div>
                    </div>

                    {/* Left glow accent based on action */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                      event.action === 'Block' || event.action === 'Tarpit'
                        ? 'bg-red-500'
                        : event.action === 'Challenge'
                        ? 'bg-yellow-500'
                        : event.action === 'Throttle'
                        ? 'bg-orange-500'
                        : 'bg-emerald-500/40'
                    }`} />
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 py-4 md:px-8 text-center text-xs text-slate-600">
        <p>© 2026 Antigravity Bot Shield. Built for High-Traffic Elasticsearch APIs. Verified Proxy & Distributed Rate Limiter.</p>
      </footer>
    </div>
  );
}
