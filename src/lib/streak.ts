export interface StreakState {
  current: number;
  longest: number;
  lastDay: string | null;
}

const STORAGE_KEY = 'kinetix-streak-v1';

export function dayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

export function readStreak(): StreakState {
  if (typeof window === 'undefined') {
    return { current: 0, longest: 0, lastDay: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { current: 0, longest: 0, lastDay: null };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      current: Number.isFinite(parsed.current) ? Math.max(0, Number(parsed.current)) : 0,
      longest: Number.isFinite(parsed.longest) ? Math.max(0, Number(parsed.longest)) : 0,
      lastDay: typeof parsed.lastDay === 'string' ? parsed.lastDay : null,
    };
  } catch {
    return { current: 0, longest: 0, lastDay: null };
  }
}

/**
 * Records today's visit. Returns the effective streak, collapsing stale
 * streaks to zero when the last visit is older than yesterday.
 */
export function registerVisit(state: StreakState, now: Date = new Date()): StreakState {
  const today = dayKey(now);
  if (state.lastDay === today) {
    return state;
  }

  let current = 1;
  if (state.lastDay) {
    const gap = daysBetween(state.lastDay, today);
    if (gap === 1) {
      current = state.current + 1;
    } else if (gap <= 0) {
      current = Math.max(1, state.current);
    }
  }

  return {
    current,
    longest: Math.max(state.longest, current),
    lastDay: today,
  };
}

export function persistStreak(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota/private-mode errors
  }
}

export function effectiveStreak(state: StreakState, now: Date = new Date()): number {
  if (!state.lastDay) return 0;
  const gap = daysBetween(state.lastDay, dayKey(now));
  if (gap <= 0) return state.current;
  if (gap === 1) return state.current;
  return 0;
}
