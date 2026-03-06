import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.football-data.org/v4';
const KEY  = process.env.FOOTBALL_DATA_API_KEY ?? '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${BASE}/teams/${id}/matches?competitions=PL&status=FINISHED&limit=8`,
      {
        headers: { 'X-Auth-Token': KEY },
        next: { revalidate: 120 },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `API error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.matches ?? [], {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
