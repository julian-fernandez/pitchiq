'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import type { FDPlayerDetail, FDMatch } from '@/types/football-data';
import { formatDate } from '@/lib/football-data';

// ── Helpers ────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

/** Derive a consistent accent colour from the player's name */
function avatarColor(name: string): string {
  const palette = ['#E8BE00', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function PlayerAvatar({ name, size = 72 }: { name: string; size?: number }) {
  const parts  = name.trim().split(' ');
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.substring(0, 2) ?? '?');
  const color = avatarColor(name);
  return (
    <div
      className="flex items-center justify-center font-[var(--font-oswald)] font-bold text-[#0B0B0B] select-none uppercase flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {letters.toUpperCase()}
    </div>
  );
}

/** Human-readable position from `section` (granular) or `position` (broad) */
const POSITION_LABEL: Record<string, string> = {
  'Offence':            'Forward',
  'Defence':            'Defender',
  'Midfield':           'Midfielder',
  'Goalkeeper':         'Goalkeeper',
  'Centre-Forward':     'Centre-Forward',
  'Left Winger':        'Left Winger',
  'Right Winger':       'Right Winger',
  'Second Striker':     'Second Striker',
  'Attacking Midfield': 'Attacking Mid',
  'Central Midfield':   'Central Mid',
  'Defensive Midfield': 'Defensive Mid',
  'Left Midfield':      'Left Mid',
  'Right Midfield':     'Right Mid',
  'Centre-Back':        'Centre-Back',
  'Left-Back':          'Left-Back',
  'Right-Back':         'Right-Back',
};

function positionLabel(player: FDPlayerDetail): string {
  const raw = player.section ?? player.position ?? null;
  if (!raw) return 'Unknown';
  return POSITION_LABEL[raw] ?? raw;
}

// ── Match row ──────────────────────────────────────────────────────────────

/**
 * Shows the match from the player's team perspective (W/D/L).
 * teamId is the player's *current* club — used to determine home/away.
 * For historical matches at previous clubs this will be imperfect;
 * the free tier doesn't expose transfer history.
 */
function MatchRow({ match, teamId }: { match: FDMatch; teamId: number | undefined }) {
  const finished  = match.status === 'FINISHED';
  const { winner } = match.score;

  // Determine which side is "ours"
  const isHome   = match.homeTeam.id === teamId;
  const isAway   = match.awayTeam.id === teamId;
  const knownSide = isHome || isAway;

  let result: 'W' | 'D' | 'L' | null = null;
  if (finished && knownSide) {
    if (winner === 'DRAW') result = 'D';
    else if (winner === 'HOME_TEAM') result = isHome ? 'W' : 'L';
    else if (winner === 'AWAY_TEAM') result = isAway ? 'W' : 'L';
  }

  const resultCls: Record<'W' | 'D' | 'L', string> = {
    W: 'bg-emerald-500 text-[#0B0B0B]',
    D: 'bg-white/20 text-white/70',
    L: 'bg-red-600 text-white',
  };

  // Score from our perspective (goals-for first)
  const rawHome = match.score.fullTime.home ?? 0;
  const rawAway = match.score.fullTime.away ?? 0;
  const gf = isHome ? rawHome : rawAway;
  const ga = isHome ? rawAway : rawHome;

  return (
    <Link
      href={`/explorer?matchId=${match.id}`}
      className="flex items-center gap-3 bg-[#151515] border border-white/7 px-4 py-3 hover:border-[#E8BE00]/40 transition-colors group"
    >
      {/* Result badge — only shown when we know which side the player is on */}
      <span className={`font-[var(--font-oswald)] font-bold text-[10px] w-5 h-5 flex items-center justify-center flex-shrink-0 ${
        result ? resultCls[result] : 'bg-white/10 text-white/30'
      }`}>
        {result ?? '?'}
      </span>

      {/* Home team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        {match.homeTeam.crest && (
          <Image src={match.homeTeam.crest} alt="" width={18} height={18} className="object-contain flex-shrink-0" />
        )}
        <span className={`text-xs font-semibold truncate ${match.homeTeam.id === teamId ? 'text-white' : 'text-white/50'}`}>
          {match.homeTeam.shortName}
        </span>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-center min-w-[3.5rem]">
        {finished ? (
          <span className="font-[var(--font-oswald)] font-black text-sm text-white tabular-nums">
            {knownSide ? `${gf}–${ga}` : `${rawHome}–${rawAway}`}
          </span>
        ) : (
          <span className="font-[var(--font-space-mono)] text-xs text-white/30">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className={`text-xs font-semibold truncate ${match.awayTeam.id === teamId ? 'text-white' : 'text-white/50'}`}>
          {match.awayTeam.shortName}
        </span>
        {match.awayTeam.crest && (
          <Image src={match.awayTeam.crest} alt="" width={18} height={18} className="object-contain flex-shrink-0" />
        )}
      </div>

      <span className="font-[var(--font-space-mono)] text-[9px] text-white/25 flex-shrink-0">
        {formatDate(match.utcDate)}
      </span>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [player,  setPlayer]  = useState<FDPlayerDetail | null>(null);
  const [matches, setMatches] = useState<FDMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/pl/player/${id}`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
      fetch(`/api/pl/player/${id}/matches`).then(r => r.ok ? r.json() : Promise.resolve([])),
    ])
      .then(([p, m]) => {
        setPlayer(p as FDPlayerDetail);
        setMatches((m as FDMatch[]).slice().reverse());
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E8BE00] border-t-transparent animate-spin" />
    </div>
  );

  if (error || !player) return (
    <div className="min-h-screen pt-20 px-5 max-w-2xl mx-auto">
      <p className="text-red-400 font-[var(--font-space-mono)]">Failed to load player: {error}</p>
    </div>
  );

  const playerAge = player.dateOfBirth ? calcAge(player.dateOfBirth) : null;
  const pos       = positionLabel(player);

  /**
   * The person endpoint sometimes returns the national team as currentTeam
   * during international breaks. Infer the actual club by finding the team ID
   * that appears in every PL match (opponents rotate, the player's club doesn't).
   */
  const inferredClubId = (() => {
    if (!matches.length) return player.currentTeam?.id;
    const counts: Record<number, number> = {};
    for (const m of matches) {
      counts[m.homeTeam.id] = (counts[m.homeTeam.id] ?? 0) + 1;
      counts[m.awayTeam.id] = (counts[m.awayTeam.id] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? Number(sorted[0][0]) : player.currentTeam?.id;
  })();

  /**
   * Build a display-ready club object. If the API returned a national team,
   * pull the real club's name/crest from the match data instead.
   */
  const inferredClub = (() => {
    if (!inferredClubId) return player.currentTeam ?? null;
    // Try to find it in the match list (free — no extra API call)
    for (const m of matches) {
      if (m.homeTeam.id === inferredClubId) return { ...m.homeTeam, contract: player.currentTeam?.contract };
      if (m.awayTeam.id === inferredClubId) return { ...m.awayTeam, contract: player.currentTeam?.contract };
    }
    // Fall back to currentTeam if IDs match (no national team conflict)
    if (player.currentTeam?.id === inferredClubId) return player.currentTeam;
    return null;
  })();

  // W/D/L tally from match list (using inferred club, not currentTeam)
  const tally = matches.reduce<{ W: number; D: number; L: number }>(
    (acc, m) => {
      if (m.status !== 'FINISHED') return acc;
      const isHome = m.homeTeam.id === inferredClubId;
      const isAway = m.awayTeam.id === inferredClubId;
      if (!isHome && !isAway) return acc;
      const { winner } = m.score;
      if (winner === 'DRAW') acc.D++;
      else if (winner === 'HOME_TEAM') isHome ? acc.W++ : acc.L++;
      else if (winner === 'AWAY_TEAM') isAway ? acc.W++ : acc.L++;
      return acc;
    },
    { W: 0, D: 0, L: 0 }
  );

  return (
    <div className="min-h-screen pt-20 pb-20 px-5">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header card ── */}
        <div className="bg-[#151515] border border-white/8">
          <div className="flex items-start gap-5 p-6">
            {/* Avatar */}
            <PlayerAvatar name={player.name} size={72} />

            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-space-mono)] text-[9px] text-white/30 uppercase tracking-widest mb-1">
                {pos}
              </p>
              <h1 className="font-[var(--font-oswald)] font-extrabold text-3xl text-white leading-tight tracking-tight">
                {player.name}
              </h1>

              {inferredClub && (
                <Link href={`/teams/${inferredClub.id}`} className="inline-flex items-center gap-2 mt-2 group">
                  {inferredClub.crest && (
                    <Image src={inferredClub.crest} alt="" width={16} height={16} className="object-contain" />
                  )}
                  <span className="text-sm text-white/50 group-hover:text-[#E8BE00] transition-colors">
                    {inferredClub.name}
                  </span>
                </Link>
              )}
            </div>

            {player.shirtNumber != null && (
              <div className="flex-shrink-0 w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-[var(--font-oswald)] font-black text-xl text-white/40">
                  {player.shirtNumber}
                </span>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/6 border-t border-white/7">
            {[
              { label: 'Nationality', value: player.nationality ?? '—' },
              { label: 'Age',         value: playerAge ? `${playerAge}` : '—' },
              { label: 'Position',    value: pos },
              { label: 'Club',        value: inferredClub?.shortName ?? inferredClub?.name ?? '—' },
            ].map(item => (
              <div key={item.label} className="bg-[#151515] px-4 py-3">
                <p className="font-[var(--font-space-mono)] text-[9px] text-white/25 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Contract */}
          {inferredClub?.contract && (inferredClub.contract.start || inferredClub.contract.until) && (
            <p className="font-[var(--font-space-mono)] text-[9px] text-white/20 px-6 py-3 border-t border-white/5">
              Contract: {inferredClub.contract.start ?? '?'} → {inferredClub.contract.until ?? '?'}
            </p>
          )}
        </div>

        {/* ── Club history note ── */}
        <div className="font-[var(--font-space-mono)] text-[10px] text-white/20 px-1">
          Career / transfer history not available on the free data tier.
        </div>

        {/* ── Recent matches ── */}
        {matches.length > 0 ? (
          <div>
            <div className="section-label mb-3">
              <span>Recent PL Appearances</span>
              {/* Tally */}
              <div className="flex items-center gap-2 ml-auto">
                {(['W', 'D', 'L'] as const).map(r => (
                  <span key={r} className={`font-[var(--font-oswald)] font-bold text-xs px-2 py-0.5 ${
                    r === 'W' ? 'bg-emerald-500 text-[#0B0B0B]' :
                    r === 'L' ? 'bg-red-600 text-white' : 'bg-white/15 text-white/60'
                  }`}>
                    {tally[r]}{r}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-white/7 divide-y divide-white/5">
              {matches.map(m => (
                <MatchRow key={m.id} match={m} teamId={inferredClubId} />
              ))}
            </div>

            <p className="font-[var(--font-space-mono)] text-[9px] text-white/20 mt-2 px-1">
              W/D/L shown from {inferredClub?.shortName ?? 'club'}'s perspective · results at previous clubs may be inverted
            </p>
          </div>
        ) : (
          <p className="font-[var(--font-space-mono)] text-sm text-white/25">
            No recent Premier League matches on record.
          </p>
        )}

        {/* ── Back links ── */}
        <div className="flex flex-wrap gap-3">
          {inferredClub && (
            <Link
              href={`/teams/${inferredClub.id}`}
              className="px-4 py-2 border border-white/15 font-[var(--font-space-mono)] text-xs text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              ← {inferredClub.shortName ?? inferredClub.name} squad
            </Link>
          )}
          <Link
            href="/compare"
            className="px-4 py-2 border border-white/15 font-[var(--font-space-mono)] text-xs text-white/50 hover:text-white hover:border-white/30 transition-colors"
          >
            ← All scorers
          </Link>
        </div>
      </div>
    </div>
  );
}
