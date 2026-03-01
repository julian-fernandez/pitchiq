import type {
  FDStandingsResponse,
  FDStandingEntry,
  FDMatchesResponse,
  FDMatch,
  FDMatchDetail,
  FDScorersResponse,
  FDScorer,
} from '@/types/football-data';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

async function fdFetch<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Auth-Token': KEY },
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Full 20-team TOTAL standings for the current PL season */
export async function getStandings(): Promise<FDStandingEntry[]> {
  const data = await fdFetch<FDStandingsResponse>('/competitions/PL/standings', 300);
  return data.standings.find(s => s.type === 'TOTAL')?.table ?? [];
}

/** Get the current matchday number */
export async function getCurrentMatchday(): Promise<number> {
  const data = await fdFetch<FDStandingsResponse>('/competitions/PL/standings', 300);
  return data.season.currentMatchday ?? 1;
}

/**
 * Matches for a specific matchday (or the latest 10 finished if no matchday given).
 * revalidate 60s for live matches, 300 for historical.
 */
export async function getMatchesByDay(matchday: number): Promise<FDMatch[]> {
  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/PL/matches?matchday=${matchday}`,
    60,
  );
  return data.matches;
}

/** Last N finished matches for the home-page results strip */
export async function getRecentMatches(limit = 6): Promise<FDMatch[]> {
  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/PL/matches?status=FINISHED&limit=${limit}`,
    120,
  );
  return data.matches.slice(-limit).reverse();
}

/** Upcoming / scheduled matches */
export async function getUpcomingMatches(limit = 6): Promise<FDMatch[]> {
  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/PL/matches?status=SCHEDULED,TIMED&limit=${limit}`,
    300,
  );
  return data.matches.slice(0, limit);
}

/** Full match detail — goals, bookings, subs */
export async function getMatchDetail(id: number): Promise<FDMatchDetail> {
  return fdFetch<FDMatchDetail>(`/matches/${id}`, 60);
}

/** Top scorers for the current season */
export async function getScorers(limit = 20): Promise<FDScorer[]> {
  const data = await fdFetch<FDScorersResponse>(
    `/competitions/PL/scorers?limit=${limit}`,
    300,
  );
  return data.scorers;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function scoreLabel(match: FDMatch): string {
  const { home, away } = match.score.fullTime;
  if (home == null || away == null) return 'vs';
  return `${home} – ${away}`;
}

/** Returns 'W', 'D', or 'L' from the perspective of the given teamId */
export function resultFor(match: FDMatch, teamId: number): 'W' | 'D' | 'L' | null {
  const { winner } = match.score;
  if (!winner) return null;
  if (winner === 'DRAW') return 'D';
  const isHome = match.homeTeam.id === teamId;
  if ((winner === 'HOME_TEAM' && isHome) || (winner === 'AWAY_TEAM' && !isHome)) return 'W';
  return 'L';
}

/** Parse the 'form' string (e.g. "W,D,L,W,W") into an array of results */
export function parseForm(form: string | null): Array<'W' | 'D' | 'L'> {
  if (!form) return [];
  return form.split(',').map(r => r.trim() as 'W' | 'D' | 'L');
}
