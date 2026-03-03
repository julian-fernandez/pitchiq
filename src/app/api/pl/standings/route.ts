import { NextRequest, NextResponse } from 'next/server';
import type { FDStandingsResponse } from '@/types/football-data';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'TOTAL';

  try {
    const res = await fetch(`${BASE}/competitions/PL/standings`, {
      headers: { 'X-Auth-Token': KEY },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status });
    }

    const data: FDStandingsResponse = await res.json();
    const table = data.standings.find(s => s.type === type)?.table ?? [];

    return NextResponse.json({ table, season: data.season }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
