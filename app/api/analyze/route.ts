import { NextResponse } from 'next/server';

function isNumeric(value: string) {
  return !isNaN(Number(value));
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRandomEmail() {
  const names = ['alice', 'bob', 'charlie', 'dave', 'emma', 'john', 'lisa'];
  const domains = ['example.com', 'mail.com', 'test.org'];
  const name = names[Math.floor(Math.random() * names.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}${Math.floor(Math.random() * 100)}@${domain}`;
}

function getRandomNumber(min = 20, max = 100000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { csvData } = body;

  const changeLog: string[] = [];

  if (!csvData || csvData.length === 0) {
    return NextResponse.json({ cleaned: [], changeLog });
  }

  const header = csvData[0];
  let rows = csvData.slice(1);

  let missingCount = 0;
  let invalidCount = 0;

  rows = rows.map((row: string[], rowIndex: number) =>
    row.map((val, colIndex) => {
      // Fill missing with "0"
      if (val === '') {
        missingCount++;
        return '0';
      }

      // Fix invalid email
      if (colIndex === 3 && !isEmail(val)) {
        invalidCount++;
        return getRandomEmail();
      }

      // Fix invalid number in numeric columns
      if ((colIndex === 2 || colIndex === 4) && !isNumeric(val)) {
        invalidCount++;
        return getRandomNumber().toString();
      }

      return val;
    })
  );

  if (missingCount > 0) changeLog.push(`Replaced ${missingCount} missing value(s) with 0`);
  if (invalidCount > 0) changeLog.push(`Replaced ${invalidCount} invalid value(s) with random valid values`);

  // Remove duplicate rows (excluding header)
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
  if (removed > 0) changeLog.push(`Removed ${removed} duplicate row(s)`);

  const cleaned = [header, ...filteredRows];

  return NextResponse.json({
    cleaned,
    changeLog,
  });
}
