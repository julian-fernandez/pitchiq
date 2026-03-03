'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FDStandingEntry } from '@/types/football-data';
import { parseForm } from '@/lib/football-data';

// Zone config
const ZONES = [
  { label: 'Champions League',              min: 1, max: 4,  color: '#1d4ed8' },
  { label: 'Europa League',                 min: 5, max: 5,  color: '#16a34a' },
  { label: 'Conference League Qualification',min: 6, max: 6,  color: '#d97706' },
  { label: 'Relegation',                    min: 18, max: 20, color: '#dc2626' },
];

function getZoneColor(position: number): string {
  for (const z of ZONES) {
    if (position >= z.min && position <= z.max) return z.color;
  }
  return 'transparent';
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const styles = {
    W: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    D: 'bg-white/10 text-white/50 border-white/15',
    L: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${styles[result]}`}>
      {result}
    </span>
  );
}

type SortKey = 'points' | 'goalsFor' | 'goalDifference' | 'won';

export default function TablePage() {
  const [table, setTable] = useState<FDStandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [view, setView] = useState<'TOTAL' | 'HOME' | 'AWAY'>('TOTAL');

  const [seasonLabel, setSeasonLabel] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pl/standings?type=${view}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: { table: FDStandingEntry[]; season: { startDate: string; endDate: string } }) => {
        setTable(data.table ?? []);
        if (data.season) {
          const start = new Date(data.season.startDate).getFullYear();
          const end   = new Date(data.season.endDate).getFullYear();
          setSeasonLabel(`${start}/${String(end).slice(2)}`);
        }
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [view]);

  const sorted = [...table].sort((a, b) => {
    if (sortKey === 'points')         return b.points - a.points;
    if (sortKey === 'goalsFor')       return b.goalsFor - a.goalsFor;
    if (sortKey === 'goalDifference') return b.goalDifference - a.goalDifference;
    if (sortKey === 'won')            return b.won - a.won;
    return 0;
  });

  const cols: Array<{ key: SortKey; label: string; title: string }> = [
    { key: 'points',         label: 'Pts', title: 'Points' },
    { key: 'won',            label: 'W',   title: 'Wins' },
    { key: 'goalsFor',       label: 'GF',  title: 'Goals For' },
    { key: 'goalDifference', label: 'GD',  title: 'Goal Difference' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20 px-5">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="border-b border-white/8 pb-5 mb-6">
          <div className="section-label mb-3">
            <span>{seasonLabel ? `${seasonLabel} Season` : 'Current Season'}</span>
          </div>
          <h1 className="font-[var(--font-oswald)] font-bold text-4xl text-white uppercase tracking-tight">
            Premier League Table
          </h1>
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mb-5">
          {(['TOTAL', 'HOME', 'AWAY'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-[var(--font-oswald)] font-semibold uppercase tracking-wider transition-colors ${
                view === v
                  ? 'bg-[#E8BE00] text-[#0B0B0B]'
                  : 'border border-white/15 text-white/50 hover:text-white hover:border-white/30'
              }`}
            >
              {v.charAt(0) + v.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-[#E8BE00] border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono text-sm">
            Failed to load standings: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="border border-white/7 overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_auto_3rem] gap-1 px-4 py-2.5 border-b border-white/7 bg-[#151515] text-[10px] font-[var(--font-space-mono)] text-white/30 uppercase tracking-widest">
                <span>#</span>
                <span>Club</span>
                <span className="text-right">MP</span>
                <span className="text-right">W</span>
                <span className="text-right">D</span>
                <span className="text-right">L</span>
                <span className="text-right">GD</span>
                <span className="hidden sm:block text-right pr-2">Form</span>
                {cols.filter(c => c.key === sortKey || c.key === 'points').slice(0, 1).map(c => (
                  <span key={c.key} className="text-right text-[#E8BE00]">{c.label}</span>
                ))}
              </div>

              {sorted.map((entry, i) => {
                const zone = getZoneColor(entry.position);
                const form = parseForm(entry.form).slice(-5);
                const isOdd = i % 2 === 1;

                return (
                  <div
                    key={entry.team.id}
                    className={`grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_auto_3rem] gap-1 px-4 py-3 items-center transition-colors hover:bg-white/5
                      ${i < sorted.length - 1 ? 'border-b border-white/5' : ''}
                      ${isOdd ? 'bg-white/[0.015]' : ''}`}
                  >
                    {/* Position + zone bar */}
                    <div className="flex items-center gap-1.5">
                      {zone !== 'transparent' ? (
                        <span className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ background: zone }} aria-hidden="true" />
                      ) : (
                        <span className="w-0.5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-xs font-mono text-white/40">{entry.position}</span>
                    </div>

                    {/* Crest + Name — clickable */}
                    <Link href={`/teams/${entry.team.id}`} className="flex items-center gap-2.5 min-w-0 group">
                      {entry.team.crest ? (
                        <Image
                          src={entry.team.crest}
                          alt={entry.team.shortName}
                          width={22}
                          height={22}
                          className="flex-shrink-0 object-contain group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded bg-white/10 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white truncate block group-hover:text-[#E8BE00] transition-colors">{entry.team.shortName}</span>
                      </div>
                    </Link>

                    <span className="text-xs font-mono text-white/45 text-right">{entry.playedGames}</span>
                    <span className="text-xs font-mono text-white/45 text-right">{entry.won}</span>
                    <span className="text-xs font-mono text-white/45 text-right">{entry.draw}</span>
                    <span className="text-xs font-mono text-white/45 text-right">{entry.lost}</span>
                    <span className={`text-xs font-mono text-right ${entry.goalDifference > 0 ? 'text-emerald-400' : entry.goalDifference < 0 ? 'text-red-400' : 'text-white/45'}`}>
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                    </span>

                    {/* Form badges */}
                    <div className="hidden sm:flex items-center justify-end gap-0.5 pr-2">
                      {form.map((r, j) => <FormBadge key={j} result={r} />)}
                    </div>

                    <span className="text-sm font-[var(--font-oswald)] font-black text-[#E8BE00] text-right tabular-nums">
                      {entry.points}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sort controls */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="font-[var(--font-space-mono)] text-[10px] text-white/25 uppercase tracking-widest">Sort by</span>
              {cols.map(c => (
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

            {/* Zone legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 font-[var(--font-space-mono)] text-[9px] text-white/30 uppercase tracking-wide">
              {ZONES.map(z => (
                <span key={z.label} className="flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-sm" style={{ background: z.color }} />
                  {z.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
