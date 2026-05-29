import { type BotEvent } from '../types/monitor';
import LiveFeedItem from './LiveFeedItem';

interface LiveFeedListProps {
  events: BotEvent[];
  queuedEventsCount: number;
  isPaused: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function LiveFeedList({
  events,
  queuedEventsCount,
  isPaused,
  onMouseEnter,
  onMouseLeave,
}: LiveFeedListProps) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col h-full overflow-hidden relative">
      
      {/* Stream panel header info */}
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

      {/* Paused log banner overlay */}
      {isPaused && (
        <div className="absolute top-16 left-6 right-6 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl flex justify-between items-center text-xs text-indigo-300 z-10 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Feed paused on hover. Reading logs...</span>
          </div>
          <span className="font-mono bg-indigo-500/25 px-2 py-0.5 rounded text-[10px]">
            {queuedEventsCount} events queued
          </span>
        </div>
      )}

      {/* Log Feed List */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar transition-all duration-300 ${
          isPaused ? 'pt-14' : ''
        }`}
      >
        {events.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-slate-600 py-20 space-y-2">
            <svg className="w-12 h-12 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <p className="text-sm font-medium">Waiting for incoming traffic stream...</p>
          </div>
        ) : (
          events.map((event) => (
            <LiveFeedItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
