// Types of mitigation actions supported by the middleware
export type BotAction = 'Allow' | 'Shadow' | 'Challenge' | 'Throttle' | 'Block' | 'Tarpit';

// Single log event representing an incoming request evaluated by rules
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

// Rolling metrics tracked over the current session
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

// State container for the monitor reducer
export interface MonitorState {
  events: BotEvent[];
  queuedEvents: BotEvent[];
  isPaused: boolean;
  activeSimulator: string;
  stats: DashboardStats;
}

// Reducer action types
export type MonitorAction =
  | { type: 'ADD_EVENT'; payload: BotEvent }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'FLUSH_QUEUE' }
  | { type: 'SET_SIMULATOR'; payload: string }
  | { type: 'RESET_STATS' };
