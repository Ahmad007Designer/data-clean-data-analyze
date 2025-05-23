import Papa from "papaparse";

export interface RowIssue {
  row: number;
  issues: string[];
}

export interface CleanCSVResult {
  cleanedCSV: string;
  issues: RowIssue[];
  columnTypes: Record<string, string>;
  issueCounts: {
    missing: number;
    invalidData: number;
    duplicateValue: number;
    duplicateRow: number;
  };
}

type CSVRow = Record<string, string>;

function detectType(value: unknown): string {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "boolean") return "boolean";
  if (!isNaN(Date.parse(String(value)))) return "date";
  if (!isNaN(parseFloat(String(value))) && isFinite(Number(value))) return "number";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object") return "json";
    } catch {}
  }
  return "string";
}

function guessColumnType(values: unknown[]): string {
  const typeCounts: Record<string, number> = {};
  values.forEach((val) => {
    const type = detectType(val);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  return Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
}

export function cleanCSV(rawCSV: string): CleanCSVResult {
  const result = Papa.parse(rawCSV, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const rows = result.data as CSVRow[];
  const fields = result.meta.fields || [];

  const issues: RowIssue[] = [];
  const seenRows = new Set<string>();
  const columnTypes: Record<string, string> = {};
  const columnValueMap: Record<string, Set<string>> = {};
  const issueCounts = {
    missing: 0,
    invalidData: 0,
    duplicateValue: 0,
    duplicateRow: 0,
  };

  // Infer column types from a sample
  const sampleSize = Math.min(rows.length, 50);
  for (const field of fields) {
    const sampleValues = rows.slice(0, sampleSize).map((r) => r[field]);
    columnTypes[field] = guessColumnType(sampleValues);
    columnValueMap[field] = new Set();
  }

  const cleanedRows: CSVRow[] = [];

  rows.forEach((row, i) => {
    const rowIssues: string[] = [];
    const rowStr = JSON.stringify(row);

    if (seenRows.has(rowStr)) {
      rowIssues.push("Duplicate row");
      issueCounts.duplicateRow++;
    } else {
      seenRows.add(rowStr);
    }

    for (const field of fields) {
      const rawVal = row[field];
      const val = (typeof rawVal === "string" ? rawVal.trim() : String(rawVal ?? "").trim());
      const expectedType = columnTypes[field];

      // Check for missing values
      if (val === "" || val.toLowerCase() === "null" || val.toLowerCase() === "undefined") {
        rowIssues.push(`Missing value in "${field}"`);
        issueCounts.missing++;
      } else {
        const actualType = detectType(val);
        // Check for invalid data type
        if (actualType !== expectedType && expectedType !== "string") {
          rowIssues.push(`Expected ${expectedType} but got ${actualType} in "${field}"`);
          issueCounts.invalidData++;
        }

        // Check for duplicate values
        if (columnValueMap[field].has(val)) {
          rowIssues.push(`Duplicate value "${val}" in "${field}"`);
          issueCounts.duplicateValue++;
        } else {
          columnValueMap[field].add(val);
        }
      }

      // Clean up the value
      row[field] = val;
    }

    if (rowIssues.length > 0) {
      issues.push({ row: i + 2, issues: rowIssues }); // +2 to account for header
    }

    cleanedRows.push(row);
  });

  return {
    cleanedCSV: Papa.unparse(cleanedRows),
    issues,
    columnTypes,
    issueCounts,
  };
}
