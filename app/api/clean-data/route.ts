
import { NextRequest, NextResponse } from 'next/server';
import { cleanCSV } from '@/app/api/clean-data/cleanCSV';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { csv } = body;

  const result = cleanCSV(csv);

  return NextResponse.json({
    cleaned: result.cleanedCSV,
    issues: result.issues,
    issueCounts: result.issueCounts,
  });
}
