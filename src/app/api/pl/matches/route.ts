import { NextRequest, NextResponse } from 'next/server';
import type { FDMatchesResponse } from '@/types/football-data';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(req: NextRequest) {
  const matchday = req.nextUrl.searchParams.get('matchday');
  const status   = req.nextUrl.searchParams.get('status');
  const limit    = req.nextUrl.searchParams.get('limit') ?? '10';

  const params = new URLSearchParams();
  if (matchday) params.set('matchday', matchday);
  if (status)   params.set('status', status);
  params.set('limit', limit);

  try {
    const res = await fetch(
      `${BASE}/competitions/PL/matches?${params.toString()}`,
      {
        headers: { 'X-Auth-Token': KEY },
        next: { revalidate: matchday ? 60 : 120 },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status });
    }

    const data: FDMatchesResponse = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
