'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';

export default function DataCleanerPage() {
  const [csvData, setCsvData] = useState<any[][] | null>(null);
  const [cleanedData, setCleanedData] = useState<any[][] | null>(null);
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [options, setOptions] = useState({
    missing: 'average',
    duplicates: 'remove',
    invalids: 'highlight',
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { data } = Papa.parse(text, {
        header: false, // << Accept any data structure
        skipEmptyLines: true,
      });
      setCsvData(data as any[][]);
    };
    reader.readAsText(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const result = Papa.parse(pasted.trim(), {
      header: false,
      skipEmptyLines: true,
    });
    setCsvData(result.data as any[][]);
    setCleanedData(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ csvData, options }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    setCleanedData(result.cleaned);
    setChangeLog(result.changeLog || []);
  };

  const downloadCSV = () => {
    if (!cleanedData) return;
    const csv = Papa.unparse(cleanedData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    a.click();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-blue-600">Upload Your CSV</h1>

      <div
        className={`border-2 border-dashed p-6 rounded-xl text-center ${
          dragging ? 'bg-blue-50 border-blue-500' : 'border-gray-300'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <p className="text-gray-500 mb-2">Drag and drop your CSV here</p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>

      <textarea
        placeholder="Or paste CSV data here"
        onPaste={handlePaste}
        className="w-full h-32 border rounded-lg p-2"
      />

      {csvData && (
        <>
          <h2 className="text-xl font-bold text-blue-600">Data Cleaner</h2>
          <div className="bg-white p-4 rounded-xl shadow space-y-4 text-black">
            <div>
              <label>Missing Values</label>
              <select
                className="w-full border p-2"
                value={options.missing}
                onChange={(e) => setOptions((o) => ({ ...o, missing: e.target.value }))}
              >
                <option value="average">Fill with zero</option>
                <option value="placeholder">Fill with placeholder</option>
                <option value="none">Ignore</option>
              </select>
            </div>

            <div>
              <label>Duplicate Rows</label>
              <select
                className="w-full border p-2"
                value={options.duplicates}
                onChange={(e) => setOptions((o) => ({ ...o, duplicates: e.target.value }))}
              >
                <option value="remove">Remove Duplicates</option>
                <option value="none">Ignore</option>
              </select>
            </div>

            <div>
              <label>Invalid Entries</label>
              <select
                className="w-full border p-2"
                value={options.invalids}
                onChange={(e) => setOptions((o) => ({ ...o, invalids: e.target.value }))}
              >
                <option value="highlight">Highlight for review</option>
                <option value="remove">Remove</option>
                <option value="none">Ignore</option>
              </select>
            </div>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleSubmit}
            >
              Clean Data
            </button>
          </div>
        </>
      )}

      {cleanedData && (
        <>
          <h2 className="text-xl font-bold text-green-600">Cleaned Data Preview</h2>
          <div className="overflow-auto border max-h-[400px]">
            <table className="table-auto w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {cleanedData[0].map((col, i) => (
                    <th key={i} className="border p-2">{`Column ${i + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleanedData.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border p-1">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={downloadCSV}
          >
            Download Cleaned CSV
          </button>

          {changeLog.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-yellow-600">Change Log</h3>
              <ul className="list-disc pl-6 text-xl text-white">
                {changeLog.map((log, idx) => (
                  <li key={idx}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
