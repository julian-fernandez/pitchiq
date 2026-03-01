// ── API-Football (RapidAPI) response shapes ────────────────────────────────
// Free tier: 100 calls/day · https://www.api-football.com/

export interface AFTeam {
  id:   number;
  name: string;
  logo: string;
}

export interface AFPlayer {
  id:     number;
  name:   string;
  number: number;
  pos:    'G' | 'D' | 'M' | 'F';  // Goalkeeper/Defender/Midfielder/Forward
  grid:   string | null;           // e.g. "1:1" — pitch position on formation grid
}

export interface AFLineupEntry {
  team:      AFTeam;
  formation: string;              // e.g. "4-3-3"
  startXI:   { player: AFPlayer }[];
  substitutes: { player: AFPlayer }[];
  coach: { id: number; name: string; photo: string };
}

export type AFEventType = 'Goal' | 'Card' | 'subst' | 'Var';
export type AFEventDetail =
  | 'Normal Goal' | 'Own Goal' | 'Penalty'
  | 'Yellow Card' | 'Red Card' | 'Yellow Red Card'
  | 'Substitution 1' | 'Substitution 2' | 'Substitution 3'
  | string;

export interface AFEvent {
  time:     { elapsed: number; extra: number | null };
  team:     AFTeam;
  player:   { id: number; name: string };
  assist:   { id: number | null; name: string | null };
  type:     AFEventType;
  detail:   AFEventDetail;
  comments: string | null;
}

export interface AFStatEntry {
  type:  string;   // e.g. "Ball Possession", "Total Shots"
  value: string | number | null;
}

export interface AFTeamStats {
  team:       AFTeam;
  statistics: AFStatEntry[];
}

export interface AFFixtureDetail {
  lineups:    AFLineupEntry[];
  events:     AFEvent[];
  statistics: AFTeamStats[];
}
