import { type DashboardStats } from '../types/monitor';

interface StatsBarProps {
  stats: DashboardStats;
  blockRate: number;
  avgLatency: number;
  topRule: string;
}

export default function StatsBar({ stats, blockRate, avgLatency, topRule }: StatsBarProps) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 space-y-6">
      <h2 className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Live Performance (Rolling)</h2>
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-900/60">
          <span className="text-xs text-slate-500 block mb-1">Total Requests</span>
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">{stats.totalRequests.toLocaleString()}</span>
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
          <span className="text-2xl font-bold font-mono tracking-tight text-purple-400">{stats.tarpitCount}</span>
        </div>
      </div>

      {/* Mitigation Action Breakdown Bar */}
      <div className="space-y-2">
        <span className="text-xs text-slate-500 block">Mitigation Response Breakdown</span>
        <div className="h-3 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-900">
          {stats.totalRequests === 0 ? (
            <div className="h-full w-full bg-slate-800" />
          ) : (
            <>
              <div style={{ width: `${(stats.allowCount / stats.totalRequests) * 100}%` }} className="bg-emerald-500 transition-all duration-300" title="Allow" />
              <div style={{ width: `${(stats.shadowCount / stats.totalRequests) * 100}%` }} className="bg-blue-500 transition-all duration-300" title="Shadow" />
              <div style={{ width: `${(stats.challengeCount / stats.totalRequests) * 100}%` }} className="bg-yellow-500 transition-all duration-300" title="Challenge" />
              <div style={{ width: `${(stats.throttleCount / stats.totalRequests) * 100}%` }} className="bg-orange-500 transition-all duration-300" title="Throttle" />
              <div style={{ width: `${(stats.blockCount / stats.totalRequests) * 100}%` }} className="bg-red-500 transition-all duration-300" title="Block" />
              <div style={{ width: `${(stats.tarpitCount / stats.totalRequests) * 100}%` }} className="bg-purple-600 transition-all duration-300" title="Tarpit" />
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Allow: {stats.allowCount}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span> Shadow: {stats.shadowCount}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block"></span> Challenge: {stats.challengeCount}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block"></span> Throttle: {stats.throttleCount}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Block: {stats.blockCount}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600 inline-block"></span> Tarpit: {stats.tarpitCount}</span>
        </div>
      </div>

      {/* Top Triggered Rule */}
      <div className="border-t border-slate-900 pt-4">
        <span className="text-xs text-slate-500 block mb-1">Top Triggered Rule</span>
        <span className="text-sm font-semibold text-slate-300 font-mono break-words block bg-slate-950/40 p-3 rounded-lg border border-slate-900/60">
          {topRule}
        </span>
      </div>
    </div>
  );
}
