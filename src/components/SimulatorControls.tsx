interface SimulatorControlsProps {
  activeSimulator: string;
  onSetSimulator: (simId: string) => void;
  onResetStats: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
}

export default function SimulatorControls({
  activeSimulator,
  onSetSimulator,
  onResetStats,
  speed,
  onSetSpeed,
}: SimulatorControlsProps) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Card Header & Reset Stats Trigger */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Bot Stream Simulator</h2>
          <button 
            onClick={onResetStats}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
          >
            Clear Feed
          </button>
        </div>

        {/* Simulator Attack Profile Options */}
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
                onClick={() => onSetSimulator(sim.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-xs border transition-all cursor-pointer ${
                  activeSimulator === sim.id
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

      {/* Frequency Slider */}
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
          onChange={(e) => onSetSpeed(Number(e.target.value))}
          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Fast (20 req/s)</span>
          <span>Slow (1 req/s)</span>
        </div>
      </div>
    </div>
  );
}
