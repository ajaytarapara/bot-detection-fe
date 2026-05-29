interface HeaderProps {
  threatLevel: {
    label: string;
    color: string;
  };
}

export default function Header({ threatLevel }: HeaderProps) {
  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Brand logo & title */}
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

      {/* Threat Pulser Indicator */}
      <div className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wider ${threatLevel.color} transition-all duration-300 animate-pulse`}>
        STATUS: {threatLevel.label}
      </div>
    </header>
  );
}
