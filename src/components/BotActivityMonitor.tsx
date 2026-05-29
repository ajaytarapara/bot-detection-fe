import { useReducer, useEffect, useState, useMemo } from 'react';
import { monitorReducer, initialState } from '../reducer/monitorReducer';
import { generateRandomEvent } from '../utils/mockGenerator';
import Header from './Header';
import StatsBar from './StatsBar';
import SimulatorControls from './SimulatorControls';
import LiveFeedList from './LiveFeedList';

export default function BotActivityMonitor() {
  const [state, dispatch] = useReducer(monitorReducer, initialState);
  const [speed, setSpeed] = useState(300); // Frequency delay (in milliseconds)

  // Compute mitigation rate % dynamically
  const blockRate = useMemo(() => {
    if (state.stats.totalRequests === 0) return 0;
    const mitigated = state.stats.blockCount + state.stats.challengeCount + state.stats.throttleCount + state.stats.tarpitCount;
    return Math.round((mitigated / state.stats.totalRequests) * 100);
  }, [state.stats]);

  // Compute average latency overhead (excluding tarpitted requests to prevent skew)
  const avgLatency = useMemo(() => {
    if (state.stats.totalRequests === 0) return 0;
    const nonTarpitRequests = state.stats.totalRequests - state.stats.tarpitCount;
    if (nonTarpitRequests <= 0) return 5000;
    const nonTarpitLatency = state.stats.totalLatencyMs - (state.stats.tarpitCount * 5000);
    return parseFloat((nonTarpitLatency / nonTarpitRequests).toFixed(2));
  }, [state.stats]);

  // Determine top triggered firewall rule
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

  // Categorize overall system threat status
  const threatLevel = useMemo(() => {
    if (blockRate > 60) return { label: 'CRITICAL ATTACK', color: 'text-red-500 border-red-500 bg-red-950/30' };
    if (blockRate > 30) return { label: 'ELEVATED RISK', color: 'text-orange-500 border-orange-500 bg-orange-950/30' };
    if (blockRate > 10) return { label: 'MODERATE ACTIVITY', color: 'text-yellow-500 border-yellow-500 bg-yellow-950/30' };
    return { label: 'SECURE', color: 'text-green-500 border-green-500 bg-green-950/30' };
  }, [blockRate]);

  // Live Simulator timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateRandomEvent(state.activeSimulator);
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
    }, speed);

    return () => clearInterval(interval);
  }, [speed, state.activeSimulator]);

  // Event handlers
  const handleMouseEnter = () => dispatch({ type: 'SET_PAUSED', payload: true });
  const handleMouseLeave = () => dispatch({ type: 'SET_PAUSED', payload: false });
  const handleSetSimulator = (simId: string) => dispatch({ type: 'SET_SIMULATOR', payload: simId });
  const handleResetStats = () => dispatch({ type: 'RESET_STATS' });

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* 1. HEADER BRANDING & PULSER */}
      <Header threatLevel={threatLevel} />

      {/* 2. MAIN GRID CONTAINER */}
      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Left Column: Rolling metrics & scenario configuration */}
        <div className="space-y-6 lg:col-span-1 flex flex-col">
          <StatsBar
            stats={state.stats}
            blockRate={blockRate}
            avgLatency={avgLatency}
            topRule={topRule}
          />
          <SimulatorControls
            activeSimulator={state.activeSimulator}
            onSetSimulator={handleSetSimulator}
            onResetStats={handleResetStats}
            speed={speed}
            onSetSpeed={setSpeed}
          />
        </div>

        {/* Right Column: Live scrollable event list */}
        <div className="lg:col-span-2 flex flex-col h-[750px] lg:h-auto">
          <LiveFeedList
            events={state.events}
            queuedEventsCount={state.queuedEvents.length}
            isPaused={state.isPaused}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </div>

      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 py-4 md:px-8 text-center text-xs text-slate-600">
        <p>© 2026 Antigravity Bot Shield. Built for High-Traffic Elasticsearch APIs. Verified Proxy & Distributed Rate Limiter.</p>
      </footer>
    </div>
  );
}
