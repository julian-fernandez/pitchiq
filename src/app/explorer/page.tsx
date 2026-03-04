'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import type { FDMatch, FDMatchDetail, FDMatchesResponse, FDScore } from '@/types/football-data';
import { formatDate, formatTime, scoreLabel } from '@/lib/football-data';

// ── Helpers ────────────────────────────────────────────────────────────────

function statusBadge(status: FDMatch['status']) {
  const map: Record<string, { label: string; cls: string }> = {
    FINISHED:  { label: 'FT',   cls: 'bg-white/10 text-white/40' },
    IN_PLAY:   { label: 'LIVE', cls: 'bg-[#FF2D2D] text-white animate-pulse' },
    PAUSED:    { label: 'HT',   cls: 'bg-amber-500/80 text-white' },
    SCHEDULED: { label: 'TBD',  cls: 'bg-white/8 text-white/30' },
    TIMED:     { label: 'TBD',  cls: 'bg-white/8 text-white/30' },
    POSTPONED: { label: 'PPD',  cls: 'bg-white/8 text-white/30' },
  };
  const cfg = map[status] ?? { label: status, cls: 'bg-white/8 text-white/30' };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-[var(--font-space-mono)] font-semibold uppercase ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Match card ─────────────────────────────────────────────────────────────

function MatchCard({ match, selected, onSelect }: {
  match: FDMatch;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const finished = match.status === 'FINISHED';
  return (
    <button
      onClick={() => onSelect(match.id)}
      className={`w-full text-left px-4 py-3.5 border transition-all ${
        selected
          ? 'bg-[#0B0B0B] border-[#E8BE00]/50 ring-1 ring-[#E8BE00]/20'
          : 'bg-[#151515] border-white/7 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {statusBadge(match.status)}
        {!finished && (
          <span className="text-[10px] font-[var(--font-space-mono)] text-white/25">{formatTime(match.utcDate)}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-semibold text-white truncate">{match.homeTeam.shortName}</span>
          {match.homeTeam.crest && <Image src={match.homeTeam.crest} alt="" width={18} height={18} className="flex-shrink-0 object-contain" />}
        </div>
        <div className={`font-[var(--font-oswald)] font-black text-sm tabular-nums text-center min-w-[3.5rem] ${finished ? 'text-white' : 'text-white/30'}`}>
          {finished ? scoreLabel(match) : '–'}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.awayTeam.crest && <Image src={match.awayTeam.crest} alt="" width={18} height={18} className="flex-shrink-0 object-contain" />}
          <span className="text-xs font-semibold text-white truncate">{match.awayTeam.shortName}</span>
        </div>
      </div>
    </button>
  );
}

// ── H2H helpers ────────────────────────────────────────────────────────────

interface H2HAggregate {
  numberOfMatches: number;
  totalGoals: number;
  homeTeam: { id: number; name: string; wins: number; draws: number; losses: number };
  awayTeam: { id: number; name: string; wins: number; draws: number; losses: number };
}

interface H2HMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string; shortName: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; crest: string };
  score: FDScore;
}

interface H2HResponse {
  available: boolean;
  aggregates?: H2HAggregate;
  matches?: H2HMatch[];
}

function H2HRow({ match }: { match: H2HMatch }) {
  const { winner } = match.score;
  const h = match.score.fullTime.home ?? 0;
  const a = match.score.fullTime.away ?? 0;

  // Highlight the winner's name — neutral, not tied to either team's perspective
  const homeBold = winner === 'HOME_TEAM';
  const awayBold = winner === 'AWAY_TEAM';
  const scoreCls = winner === 'HOME_TEAM' ? 'text-white' : winner === 'AWAY_TEAM' ? 'text-white' : 'text-white/50';

  return (
    <Link
      href={`/explorer?matchId=${match.id}`}
      className="flex items-center gap-2 py-2 px-3 hover:bg-white/3 transition-colors group"
    >
      <span className="font-[var(--font-space-mono)] text-[9px] text-white/25 w-14 flex-shrink-0">
        {match.utcDate.substring(0, 7)}
      </span>
      <span className={`flex-1 text-[11px] truncate text-right transition-colors ${homeBold ? 'font-semibold text-white' : 'text-white/45'}`}>
        {match.homeTeam.shortName}
      </span>
      <span className={`font-[var(--font-oswald)] font-bold text-xs tabular-nums flex-shrink-0 min-w-[2.5rem] text-center ${scoreCls}`}>
        {h}–{a}
      </span>
      <span className={`flex-1 text-[11px] truncate transition-colors ${awayBold ? 'font-semibold text-white' : 'text-white/45'}`}>
        {match.awayTeam.shortName}
      </span>
      <span className="font-[var(--font-space-mono)] text-[9px] text-white/20 group-hover:text-white/40 flex-shrink-0">→</span>
    </Link>
  );
}

// ── Match Detail Panel ─────────────────────────────────────────────────────

function MatchDetailPanel({ matchId }: { matchId: number }) {
  const [detail,  setDetail]  = useState<FDMatchDetail | null>(null);
  const [h2h,     setH2H]     = useState<H2HResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setH2H(null);
    Promise.all([
      fetch(`/api/pl/match/${matchId}`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
      fetch(`/api/pl/match/${matchId}/events`).then(r => r.ok ? r.json() : Promise.resolve({ available: false })),
    ])
      .then(([d, h]: [FDMatchDetail, H2HResponse]) => {
        setDetail(d);
        setH2H(h);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 border-2 border-[#E8BE00] border-t-transparent animate-spin" />
    </div>
  );

  if (!detail) return (
    <p className="text-red-400 font-[var(--font-space-mono)] text-xs p-4">Could not load match.</p>
  );

  const { homeTeam, awayTeam, score } = detail;
  const finished = detail.status === 'FINISHED';
  const referee  = detail.referees?.find(r => r.type === 'REFEREE');
  const agg      = h2h?.available ? h2h.aggregates : undefined;
  const h2hMatches = (h2h?.available ? h2h.matches ?? [] : [])
    .filter(m => m.id !== matchId && m.status === 'FINISHED')
    .slice(0, 9);

  const winnerClass = (side: 'home' | 'away') => {
    if (!finished) return 'text-white';
    if (score.winner === 'DRAW') return 'text-white/60';
    return (score.winner === 'HOME_TEAM') === (side === 'home') ? 'text-white' : 'text-white/40';
  };

  return (
    <div className="space-y-6">

      {/* ── Score header ── */}
      <div className="bg-[#101010] border border-white/7 p-5">
        <p className="font-[var(--font-space-mono)] text-[9px] text-white/25 uppercase tracking-widest mb-4 text-center">
          {formatDate(detail.utcDate)} · Matchday {detail.matchday}
          {referee && <> · {referee.name}</>}
        </p>

        <div className="flex items-center gap-3">
          <Link href={`/teams/${homeTeam.id}`} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            {homeTeam.crest && (
              <Image src={homeTeam.crest} alt={homeTeam.name} width={52} height={52} className="object-contain group-hover:scale-105 transition-transform" />
            )}
            <p className={`font-[var(--font-oswald)] font-bold text-sm text-center leading-tight group-hover:text-[#E8BE00] transition-colors ${winnerClass('home')}`}>
              {homeTeam.shortName}
            </p>
          </Link>

          <div className="flex-shrink-0 text-center px-2">
            <div className="font-[var(--font-oswald)] font-black text-4xl text-white tabular-nums">
              {finished ? (
                <>{score.fullTime.home}<span className="text-white/20 mx-1.5 text-2xl">–</span>{score.fullTime.away}</>
              ) : (
                <span className="text-white/30 text-2xl">vs</span>
              )}
            </div>
            {finished && score.halfTime.home != null && (
              <p className="text-[10px] font-[var(--font-space-mono)] text-white/25 mt-1">
                HT {score.halfTime.home}–{score.halfTime.away}
              </p>
            )}
            {!finished && <p className="text-[10px] font-[var(--font-space-mono)] text-[#E8BE00] mt-1 animate-pulse">UPCOMING</p>}
          </div>

          <Link href={`/teams/${awayTeam.id}`} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            {awayTeam.crest && (
              <Image src={awayTeam.crest} alt={awayTeam.name} width={52} height={52} className="object-contain group-hover:scale-105 transition-transform" />
            )}
            <p className={`font-[var(--font-oswald)] font-bold text-sm text-center leading-tight group-hover:text-[#E8BE00] transition-colors ${winnerClass('away')}`}>
              {awayTeam.shortName}
            </p>
          </Link>
        </div>

        {/* Venue + referee row */}
        {(detail.venue || referee) && (
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {detail.venue && (
              <span className="font-[var(--font-space-mono)] text-[9px] text-white/25">🏟 {detail.venue}</span>
            )}
            {referee && (
              <span className="font-[var(--font-space-mono)] text-[9px] text-white/25">🟨 {referee.name}</span>
            )}
          </div>
        )}
      </div>

      {/* ── H2H aggregate ── */}
      {agg && (
        <div>
          <div className="section-label mb-2"><span>Head to Head · Last {agg.homeTeam.wins + agg.homeTeam.draws + agg.homeTeam.losses} PL meetings</span></div>
          <div className="grid grid-cols-3 gap-px bg-white/7 border border-white/7">
            {[
              { label: homeTeam.shortName, wins: agg.homeTeam.wins },
              { label: 'Draws',            wins: agg.homeTeam.draws },
              { label: awayTeam.shortName, wins: agg.awayTeam.wins },
            ].map((item, i) => (
              <div key={i} className="bg-[#151515] px-3 py-3 text-center">
                <p className="font-[var(--font-oswald)] font-black text-2xl text-white">{item.wins}</p>
                <p className="font-[var(--font-space-mono)] text-[9px] text-white/30 uppercase tracking-widest truncate mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="font-[var(--font-space-mono)] text-[9px] text-white/20 mt-1 text-right">
            {agg.totalGoals} total goals across {agg.numberOfMatches} meetings
          </p>
        </div>
      )}

      {/* ── H2H recent matches ── */}
      {h2hMatches.length > 0 && (
        <div>
          <div className="section-label mb-2"><span>Previous Meetings ({h2hMatches.length})</span></div>
          <div className="border border-white/7 divide-y divide-white/5">
            {h2hMatches.map(m => (
              <H2HRow key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* ── Team links ── */}
      <div className="grid grid-cols-2 gap-2">
        {[homeTeam, awayTeam].map(team => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="flex items-center gap-2 bg-[#151515] border border-white/7 px-3 py-2.5 hover:border-[#E8BE00]/30 transition-colors group"
          >
            {team.crest && <Image src={team.crest} alt="" width={24} height={24} className="object-contain flex-shrink-0" />}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-[#E8BE00] transition-colors">{team.shortName}</p>
              <p className="font-[var(--font-space-mono)] text-[9px] text-white/25">View club →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

function MatchesInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initMatchId  = Number(searchParams.get('matchId') ?? 0);
  const initMatchday = Number(searchParams.get('matchday') ?? 0);

  const [matchday,    setMatchday]    = useState(initMatchday);
  const [maxMatchday] = useState(38);
  const [matches,     setMatches]     = useState<FDMatch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState<number | null>(initMatchId || null);

  useEffect(() => {
    fetch('/api/pl/standings?type=TOTAL')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { table: unknown[]; season: { currentMatchday?: number } }) => {
        if (matchday === 0 && data.season?.currentMatchday) setMatchday(data.season.currentMatchday);
      })
      .catch(() => { if (matchday === 0) setMatchday(1); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatches = useCallback((md: number) => {
    if (md < 1) return;
    setLoading(true);
    fetch(`/api/pl/matches?matchday=${md}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: FDMatchesResponse) => { setMatches(data.matches ?? []); setLoading(false); })
      .catch(() => { setMatches([]); setLoading(false); });
  }, []);

  useEffect(() => {
    if (matchday > 0) fetchMatches(matchday);
  }, [matchday, fetchMatches]);

  function handleSelect(id: number) {
    setSelectedId(id);
    router.replace(`/explorer?matchId=${id}&matchday=${matchday}`, { scroll: false });
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-5">
      <div className="max-w-6xl mx-auto">

        <div className="border-b border-white/8 pb-5 mb-6 flex flex-wrap items-end gap-4 justify-between">
          <div>
            <div className="section-label mb-3"><span>Premier League 2025/26</span></div>
            <h1 className="font-[var(--font-oswald)] font-bold text-4xl text-white uppercase tracking-tight">Matches</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMatchday(d => Math.max(1, d - 1))}
              disabled={matchday <= 1}
              className="w-8 h-8 border border-white/15 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
              aria-label="Previous matchday"
            >‹</button>
            <span className="font-[var(--font-oswald)] font-bold text-white uppercase tracking-wide min-w-[8rem] text-center text-sm">
              {matchday ? `Matchday ${matchday}` : '…'}
            </span>
            <button
              onClick={() => setMatchday(d => Math.min(maxMatchday, d + 1))}
              disabled={matchday >= maxMatchday}
              className="w-8 h-8 border border-white/15 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
              aria-label="Next matchday"
            >›</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Match list */}
          <div className="border border-white/7 divide-y divide-white/5 overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#E8BE00] border-t-transparent animate-spin" />
              </div>
            )}
            {!loading && matches.length === 0 && (
              <p className="text-white/30 font-[var(--font-space-mono)] text-xs p-4">No matches for this matchday.</p>
            )}
            {!loading && matches.map(m => (
              <MatchCard key={m.id} match={m} selected={selectedId === m.id} onSelect={handleSelect} />
            ))}
          </div>

          {/* Detail panel */}
          <div className="bg-[#0D0D0D] border border-white/7 p-5 lg:sticky lg:top-20 overflow-y-auto max-h-[calc(100vh-6rem)]">
            {selectedId ? (
              <MatchDetailPanel key={selectedId} matchId={selectedId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                <span className="text-3xl" aria-hidden="true">⚽</span>
                <p className="font-[var(--font-space-mono)] text-xs text-white/30">Select a match to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8BE00] border-t-transparent animate-spin" />
      </div>
    }>
      <MatchesInner />
    </Suspense>
  );
}
