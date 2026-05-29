import { memo } from 'react';
import { type BotEvent, type BotAction } from '../types/monitor';

interface LiveFeedItemProps {
  event: BotEvent;
}

const LiveFeedItem = memo(function LiveFeedItem({ event }: LiveFeedItemProps) {
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
    <div className="group bg-slate-950/40 hover:bg-slate-950/80 rounded-xl p-3.5 border border-slate-900/60 hover:border-slate-800 transition-all duration-150 grid grid-cols-1 md:grid-cols-4 items-center gap-4 text-xs font-mono relative overflow-hidden">
      {/* Timestamp & masked IP */}
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

      {/* Mitigation Action badge & Rule explanation */}
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

      {/* Decorative colored glow borders depending on action risk */}
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
  );
});

export default LiveFeedItem;
