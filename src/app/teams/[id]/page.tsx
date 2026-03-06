'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import type { FDTeamDetail, FDMatch, FDSquadMember } from '@/types/football-data';
import { formatDate } from '@/lib/football-data';

// ── Position utilities ─────────────────────────────────────────────────────

const POS_ABBR: Record<string, string> = {
  'Goalkeeper':          'GK',
  'Right-Back':          'RB',
  'Left-Back':           'LB',
  'Centre-Back':         'CB',
  'Defence':             'DEF',
  'Defensive Midfield':  'DM',
  'Central Midfield':    'CM',
  'Right Midfield':      'RM',
  'Left Midfield':       'LM',
  'Attacking Midfield':  'AM',
  'Midfield':            'MID',
  'Right Winger':        'RW',
  'Left Winger':         'LW',
  'Centre-Forward':      'CF',
  'Second Striker':      'SS',
  'Offence':             'FWD',
};

function posAbbr(position: string | null): string {
  if (!position) return '?';
  return POS_ABBR[position] ?? position.substring(0, 3).toUpperCase();
}

/** Maps any granular or broad position string to one of the four group buckets */
function positionGroup(position: string | null): 'Goalkeeper' | 'Defence' | 'Midfield' | 'Offence' {
  if (!position) return 'Midfield';
  const p = position.toLowerCase();
  if (p === 'goalkeeper')                                                          return 'Goalkeeper';
  if (p.includes('back') || p === 'defence' || p.includes('centre-back'))         return 'Defence';
  if (p === 'offence' || p.includes('forward') || p.includes('winger') ||
      p.includes('striker') || p === 'second striker')                            return 'Offence';
  return 'Midfield';
}

const GROUP_LABEL: Record<string, string> = {
  Goalkeeper: 'Goalkeepers',
  Defence:    'Defenders',
  Midfield:   'Midfielders',
  Offence:    'Forwards',
};

function groupSquad(squad: FDSquadMember[]) {
  const order = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'] as const;
  const groups: Record<string, FDSquadMember[]> = { Goalkeeper: [], Defence: [], Midfield: [], Offence: [] };
  for (const p of squad) {
    const g = positionGroup(p.position);
    groups[g].push(p);
  }
  // Sort each group by shirt number then name
  for (const g of order) {
    groups[g].sort((a, b) =>
      (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99) || a.name.localeCompare(b.name)
    );
  }
  return { order, groups };
}

function age(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

/** Consistent colour derived from name — used for initials avatar */
function avatarColor(name: string): string {
  const palette = ['#E8BE00', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function Initials({ name, size = 28 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ');
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.substring(0, 2) ?? '?');
  const color = avatarColor(name);
  return (
    <div
      className="rounded flex items-center justify-center font-[var(--font-oswald)] font-bold text-[#0B0B0B] flex-shrink-0 uppercase select-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {letters.toUpperCase()}
    </div>
  );
}

// ── Result pill ────────────────────────────────────────────────────────────

function ResultPill({ match, teamId }: { match: FDMatch; teamId: number }) {
  const { winner } = match.score;
  const isHome = match.homeTeam.id === teamId;
  let result: 'W' | 'D' | 'L' = 'D';
  if (winner === 'HOME_TEAM') result = isHome ? 'W' : 'L';
  else if (winner === 'AWAY_TEAM') result = isHome ? 'L' : 'W';

  const resultCls = {
    W: 'bg-emerald-500 text-white',
    D: 'bg-white/20 text-white/70',
    L: 'bg-red-600 text-white',
  }[result];

  const opp   = isHome ? match.awayTeam : match.homeTeam;
  const gf    = isHome ? (match.score.fullTime.home ?? 0) : (match.score.fullTime.away ?? 0);
  const ga    = isHome ? (match.score.fullTime.away ?? 0) : (match.score.fullTime.home ?? 0);
  const venue = isHome ? 'H' : 'A';

  return (
    <Link
      href={`/explorer?matchId=${match.id}`}
      className="flex items-center gap-3 bg-[#151515] border border-white/7 px-3 py-2.5 hover:border-[#E8BE00]/40 transition-colors"
    >
      {/* Result badge */}
      <span className={`font-[var(--font-oswald)] font-bold text-xs w-6 h-6 flex items-center justify-center flex-shrink-0 ${resultCls}`}>
        {result}
      </span>

      {/* Venue */}
      <span className="font-[var(--font-space-mono)] text-[9px] text-white/25 w-3 flex-shrink-0">{venue}</span>

      {/* Opponent */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {opp.crest && <Image src={opp.crest} alt="" width={18} height={18} className="object-contain flex-shrink-0" />}
        <span className="text-xs font-semibold text-white truncate">{opp.shortName}</span>
      </div>

      {/* Score */}
      <span className="font-[var(--font-oswald)] font-bold text-sm text-white tabular-nums flex-shrink-0">
        {gf}–{ga}
      </span>

      <span className="font-[var(--font-space-mono)] text-[9px] text-white/25 flex-shrink-0">
        {formatDate(match.utcDate)}
      </span>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const teamId  = Number(id);

  const [team,    setTeam]    = useState<FDTeamDetail | null>(null);
  const [matches, setMatches] = useState<FDMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/pl/team/${id}`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
      fetch(`/api/pl/team/${id}/matches`).then(r => r.ok ? r.json() : Promise.resolve([])),
    ])
      .then(([t, m]) => {
        setTeam(t as FDTeamDetail);
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

  if (error || !team) return (
    <div className="min-h-screen pt-20 px-5 max-w-4xl mx-auto">
      <p className="text-red-400 font-[var(--font-space-mono)]">Failed to load team: {error}</p>
    </div>
  );

  const { order, groups } = groupSquad(team.squad ?? []);

  return (
    <div className="min-h-screen pt-20 pb-20 px-5">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="border-b border-white/8 pb-5 flex items-center gap-5">
          {team.crest
            ? <Image src={team.crest} alt={team.name} width={64} height={64} className="object-contain flex-shrink-0" />
            : <Initials name={team.name} size={64} />
          }
          <div>
            <div className="section-label mb-2"><span>Premier League · 2025/26</span></div>
            <h1 className="font-[var(--font-oswald)] font-bold text-4xl text-white uppercase tracking-tight leading-none">
              {team.name}
            </h1>
            {team.venue && <p className="text-sm text-white/40 mt-2">{team.venue}</p>}
          </div>
        </div>

        {/* ── Club facts ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/7 border border-white/7">
          {[
            { label: 'Founded',     value: team.founded?.toString() ?? '—' },
            { label: 'Kit colours', value: team.clubColors ?? '—' },
            { label: 'Manager',     value: team.coach?.name ?? '—' },
            {
              label: 'Manager from',
              value: team.coach?.nationality
                ? `${team.coach.nationality}`
                : '—',
            },
          ].map(item => (
            <div key={item.label} className="bg-[#151515] px-4 py-3">
              <p className="font-[var(--font-space-mono)] text-[9px] text-white/25 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ── Recent results ── */}
        {matches.length > 0 && (
          <div>
            <div className="section-label mb-3"><span>Recent PL Results</span></div>
            <div className="border border-white/7 overflow-hidden divide-y divide-white/5">
              {matches.map(m => (
                <ResultPill key={m.id} match={m} teamId={teamId} />
              ))}
            </div>
          </div>
        )}

        {/* ── Squad ── */}
        <div>
          <div className="section-label mb-4">
            <span>Squad ({team.squad?.length ?? 0} players)</span>
          </div>

          <div className="space-y-5">
            {order.map(pos => {
              const players = groups[pos];
              if (!players.length) return null;
              return (
                <div key={pos}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-[var(--font-oswald)] font-bold text-xs text-white/40 uppercase tracking-wider">
                      {GROUP_LABEL[pos]}
                    </span>
                    <span className="flex-1 h-px bg-white/7" />
                    <span className="font-[var(--font-space-mono)] text-[10px] text-white/20">{players.length}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 border border-white/7">
                    {players.map(p => (
                      <Link
                        key={p.id}
                        href={`/players/${p.id}`}
                        className="flex items-center gap-3 bg-[#151515] px-3 py-2.5 hover:bg-[#1C1C1C] transition-colors group"
                      >
                        {/* Shirt number */}
                        <span className="font-[var(--font-oswald)] font-bold text-sm text-white/20 w-6 text-right flex-shrink-0 tabular-nums">
                          {p.shirtNumber ?? '–'}
                        </span>

                        {/* Initials avatar */}
                        <Initials name={p.name} size={28} />

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#E8BE00] transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {p.nationality}{p.dateOfBirth ? ` · ${age(p.dateOfBirth)} yrs` : ''}
                          </p>
                        </div>

                        {/* Position badge */}
                        <span className="font-[var(--font-space-mono)] text-[9px] text-white/30 bg-white/6 px-1.5 py-0.5 flex-shrink-0">
                          {posAbbr(p.position)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-[var(--font-space-mono)] text-[9px] text-white/20 mt-4">
            Squad data via football-data.org · Photos not available on free tier
          </p>
        </div>
      </div>
    </div>
  );
}
