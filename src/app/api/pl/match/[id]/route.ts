import { NextRequest, NextResponse } from 'next/server';
import type { FDMatchDetail } from '@/types/football-data';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/matches/${id}`, {
      headers: { 'X-Auth-Token': KEY },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status });
    }

    // v4 returns the match object directly (no wrapper)
    const data: FDMatchDetail = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
