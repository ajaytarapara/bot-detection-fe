import { type MonitorState, type MonitorAction, type DashboardStats, type BotEvent } from '../types/monitor';

// Initial default empty statistics
export const initialStats: DashboardStats = {
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

// Initial state of the monitor
export const initialState: MonitorState = {
  events: [],
  queuedEvents: [],
  isPaused: false,
  activeSimulator: 'mix',
  stats: initialStats,
};

// Helper to calculate rolling metrics for each incoming event
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

  // Track rule triggering counts
  if (event.reason && event.reason !== 'Passed all rules') {
    nextStats.ruleCounts[event.reason] = (nextStats.ruleCounts[event.reason] || 0) + 1;
  }

  return nextStats;
}

// State reducer to handle user interactions and real-time simulator updates
export function monitorReducer(state: MonitorState, action: MonitorAction): MonitorState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const updatedStats = updateStats(state.stats, action.payload);
      
      // If hovered (paused), buffer events in a queue instead of rendering immediately
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

      // On resume, flush any accumulated queue items to the main screen
      if (!action.payload && state.queuedEvents.length > 0) {
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
