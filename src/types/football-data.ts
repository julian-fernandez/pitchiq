export interface FDArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

export interface FDCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
}

export interface FDSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
  winner: FDTeam | null;
}

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

// ── Standings ──────────────────────────────────────────────────────────────

export interface FDStandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FDStandingsTable {
  stage: string;
  type: 'TOTAL' | 'HOME' | 'AWAY';
  group: string | null;
  table: FDStandingEntry[];
}

export interface FDStandingsResponse {
  competition: FDCompetition;
  area: FDArea;
  season: FDSeason;
  standings: FDStandingsTable[];
}

// ── Matches ────────────────────────────────────────────────────────────────

export type FDMatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface FDScoreDetail {
  home: number | null;
  away: number | null;
}

export interface FDScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: FDScoreDetail;
  halfTime: FDScoreDetail;
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: FDMatchStatus;
  matchday: number | null;
  stage: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
}

export interface FDMatchesResponse {
  competition: FDCompetition;
  season: FDSeason;
  matches: FDMatch[];
  resultSet: {
    count: number;
    first: string;
    last: string;
    played: number;
  };
}

// ── Match Detail ───────────────────────────────────────────────────────────

export interface FDGoal {
  minute: number;
  injuryTime?: number | null;
  type: 'REGULAR' | 'EXTRA_TIME' | 'OWN' | 'PENALTY';
  team: { id: number; name: string };
  scorer: { id: number; name: string } | null;
  assist: { id: number; name: string } | null;
  score: FDScoreDetail;
}

export interface FDBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: 'YELLOW' | 'RED' | 'YELLOW_RED';
}

export interface FDSubstitution {
  minute: number;
  team: { id: number; name: string };
  playerOut: { id: number; name: string };
  playerIn: { id: number; name: string };
}

export interface FDMatchDetail extends FDMatch {
  venue?: string;
  referees: Array<{ id: number; name: string; type: string; nationality?: string }>;
  /** null on free tier — available on paid tiers only */
  goals: FDGoal[] | null;
  /** null on free tier */
  bookings: FDBooking[] | null;
  /** null on free tier */
  substitutions: FDSubstitution[] | null;
}

// ── Team ───────────────────────────────────────────────────────────────────

export interface FDSquadMember {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string;
  nationality: string;
  shirtNumber?: number | null;
}

export interface FDCoach {
  id: number;
  name: string;
  nationality?: string;
  dateOfBirth?: string;
}

export interface FDTeamDetail extends FDTeam {
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: FDCoach;
  squad: FDSquadMember[];
}

// ── Player ─────────────────────────────────────────────────────────────────

export interface FDPlayerDetail extends FDPerson {
  section?: string;
  shirtNumber?: number | null;
  currentTeam?: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
    contract?: { start?: string; until?: string };
  };
}

// ── Scorers ────────────────────────────────────────────────────────────────

export interface FDPerson {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  position?: string;
}

export interface FDScorer {
  player: FDPerson;
  team: FDTeam;
  playedMatches: number;
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export interface FDScorersResponse {
  competition: FDCompetition;
  season: FDSeason;
  scorers: FDScorer[];
}
