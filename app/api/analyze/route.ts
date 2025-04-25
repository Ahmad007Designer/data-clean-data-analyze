import { NextResponse } from 'next/server';

// Utility functions
function isNumeric(value: string): boolean {
  return !isNaN(Number(value));
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRandomEmail(): string {
  const names = ['alice', 'bob', 'charlie', 'dave', 'emma', 'john', 'lisa'];
  const domains = ['example.com', 'mail.com', 'test.org'];
  const name = names[Math.floor(Math.random() * names.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}${Math.floor(Math.random() * 100)}@${domain}`;
}

function getRandomNumber(min = 20, max = 100000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define the structure of request data
interface CleanCSVRequest {
  csvData: string[][];
}

export async function POST(req: Request) {
  const body: CleanCSVRequest = await req.json();
  const { csvData } = body;

  const changeLog: string[] = [];

  if (!csvData || csvData.length === 0) {
    return NextResponse.json({ cleaned: [], changeLog });
  }

  const header = csvData[0];
  let rows = csvData.slice(1);

  let missingCount = 0;
  let invalidCount = 0;

  rows = rows.map((row: string[]) =>
    row.map((val: string, colIndex: number): string => {
      if (val === '') {
        missingCount++;
        return '0';
      }

      if (colIndex === 3 && !isEmail(val)) {
        invalidCount++;
        return getRandomEmail();
      }

      if ((colIndex === 2 || colIndex === 4) && !isNumeric(val)) {
        invalidCount++;
        return getRandomNumber().toString();
      }

      return val;
    })
  );

  if (missingCount > 0)
    changeLog.push(`Replaced ${missingCount} missing value(s) with 0`);
  if (invalidCount > 0)
    changeLog.push(
      `Replaced ${invalidCount} invalid value(s) with random valid values`
    );

  const seen = new Set<string>();
  const filteredRows: string[][] = [];

  for (const row of rows) {
    const key = row.join('||');
    if (!seen.has(key)) {
      seen.add(key);
      filteredRows.push(row);
    }
  }

  const removed = rows.length - filteredRows.length;
  if (removed > 0)
    changeLog.push(`Removed ${removed} duplicate row(s)`);

  const cleaned = [header, ...filteredRows];

  return NextResponse.json({
    cleaned,
    changeLog,
  });
}
