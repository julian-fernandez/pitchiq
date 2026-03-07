/**
 * GET /api/pl/match/[id]/events
 *
 * Returns head-to-head history for a match using football-data.org (free tier).
 * API-Football's free plan is restricted to seasons 2022–2024 only, making it
 * unusable for the current 2025/26 season. H2H is what we can reliably provide.
 */

import { NextRequest, NextResponse } from 'next/server';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(`${FD_BASE}/matches/${id}/head2head?limit=10`, {
      headers: { 'X-Auth-Token': FD_KEY },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ available: false, reason: `fd-${res.status}` });
    }

    const data = await res.json();
    return NextResponse.json(
      { available: true, ...data },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    );
  } catch (e) {
    return NextResponse.json({ available: false, reason: String(e) });
  }
}
