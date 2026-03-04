import { NextRequest, NextResponse } from 'next/server';
import type { FDScorersResponse } from '@/types/football-data';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit') ?? '20';

  try {
    const res = await fetch(
      `${BASE}/competitions/PL/scorers?limit=${limit}`,
      {
        headers: { 'X-Auth-Token': KEY },
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status });
    }

    const data: FDScorersResponse = await res.json();
    return NextResponse.json(data.scorers, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
