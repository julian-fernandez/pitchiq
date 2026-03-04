'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FDScorer } from '@/types/football-data';

type SortKey = 'goals' | 'assists' | 'penalties' | 'playedMatches';

const SORT_COLS: Array<{ key: SortKey; label: string; title: string }> = [
  { key: 'goals',        label: 'Goals',    title: 'Total Goals' },
  { key: 'assists',      label: 'Assists',  title: 'Total Assists' },
  { key: 'penalties',    label: 'Pens',     title: 'Penalties Scored' },
  { key: 'playedMatches',label: 'MP',       title: 'Matches Played' },
];

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 text-base">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 text-base">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 text-base">🥉</span>;
  return (
    <span className="text-xs font-mono text-white/30 w-5 inline-block text-center">{rank}</span>
  );
}

function StatBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden mt-1">
      <div
        className="h-full bg-[#E8BE00] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ScorersPage() {
  const [scorers, setScorers] = useState<FDScorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('goals');
  const [limit,   setLimit]   = useState(20);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pl/scorers?limit=${limit}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: FDScorer[]) => { setScorers(data); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [limit]);

  const sorted = [...scorers].sort((a, b) => {
    const va = (a[sortKey] ?? 0) as number;
    const vb = (b[sortKey] ?? 0) as number;
    return vb - va;
  });

  const maxVal = sorted.length > 0 ? ((sorted[0][sortKey] ?? 0) as number) : 1;

  return (
    <div className="min-h-screen pt-20 pb-20 px-5">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="border-b border-white/8 pb-5 mb-6">
          <div className="section-label mb-3"><span>Current Season · 2025/26</span></div>
          <h1 className="font-[var(--font-oswald)] font-bold text-4xl text-white uppercase tracking-tight">
            Top Scorers
          </h1>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex gap-2 items-center">
            <span className="font-[var(--font-space-mono)] text-[10px] text-white/25 uppercase tracking-widest">Sort</span>
            {SORT_COLS.map(c => (
              <button
                key={c.key}
                onClick={() => setSortKey(c.key)}
                title={c.title}
                className={`px-3 py-1 text-xs font-[var(--font-oswald)] font-semibold uppercase tracking-wider transition-colors ${
                  sortKey === c.key
                    ? 'bg-[#E8BE00] text-[#0B0B0B]'
                    : 'border border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            {[10, 20, 30].map(l => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-3 py-1 text-xs font-[var(--font-oswald)] font-semibold uppercase tracking-wider transition-colors ${
                  limit === l
                    ? 'bg-[#E8BE00] text-[#0B0B0B]'
                    : 'border border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                Top {l}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-[#E8BE00] border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono text-sm">
            Failed to load scorers: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem_3.5rem_3rem] gap-3 px-4 py-2 border border-white/7 bg-[#151515] font-[var(--font-space-mono)] text-[10px] text-white/30 uppercase tracking-widest mb-2">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Goals</span>
              <span className="text-right">Assists</span>
              <span className="text-right">Pens</span>
              <span className="text-right">MP</span>
            </div>

            <div className="space-y-2">
              {sorted.map((s, i) => {
                const currentVal = (s[sortKey] ?? 0) as number;
                const isTop3 = i < 3 && sortKey === 'goals';

                return (
                  <div
                    key={s.player.id}
                    className={`bg-[#151515] border rounded-2xl px-4 py-4 transition-colors hover:border-[#E8BE00]/30 ${
                      isTop3 ? 'border-[#E8BE00]/20' : 'border-white/8'
                    }`}
                  >
                    <div className="grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem_3.5rem_3rem] gap-3 items-center">
                      {/* Rank */}
                      <div className="flex items-center justify-center">
                        <MedalIcon rank={i + 1} />
                      </div>

                      {/* Player + team — both clickable */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Link href={`/teams/${s.team.id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                          {s.team.crest && (
                            <Image
                              src={s.team.crest}
                              alt={s.team.shortName}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          )}
                        </Link>
                        <Link href={`/players/${s.player.id}`} className="min-w-0 group">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-[#E8BE00] transition-colors">{s.player.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-white/35 truncate">{s.team.shortName}</p>
                            {s.player.position && (
                              <span className="text-[10px] font-mono text-white/20 border border-white/10 rounded px-1">
                                {s.player.position?.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <span className={`font-[var(--font-oswald)] font-black tabular-nums text-sm ${sortKey === 'goals' ? 'text-[#E8BE00]' : 'text-white/70'}`}>
                          {s.goals}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-[var(--font-oswald)] font-black tabular-nums text-sm ${sortKey === 'assists' ? 'text-[#E8BE00]' : 'text-white/70'}`}>
                          {s.assists ?? '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-[var(--font-oswald)] font-black tabular-nums text-sm ${sortKey === 'penalties' ? 'text-[#E8BE00]' : 'text-white/70'}`}>
                          {s.penalties ?? '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-xs tabular-nums ${sortKey === 'playedMatches' ? 'text-[#E8BE00]' : 'text-white/40'}`}>
                          {s.playedMatches}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for current sort metric */}
                    {currentVal > 0 && (
                      <div className="mt-3 px-[2.5rem] pl-[calc(2.5rem+3rem+12px)]">
                        <StatBar value={currentVal} max={maxVal} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
