"use client";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export default function UploadCSV() {
  const [rawCsv, setRawCsv] = useState<string>("");
  const [cleanedCsv, setCleanedCsv] = useState<string>("");
  const [issues, setIssues] = useState<{ row: number; issues: string[] }[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("idle");
  const [beforeData, setBeforeData] = useState<string>("");
  const [afterData, setAfterData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setRawCsv(text);
      setBeforeData(text); // Save the raw data as 'before' data for comparison
      setIssues([]); // Reset issues on new upload
      setJobStatus("idle");
      setCleanedCsv("");
      setAfterData("");
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleClean = async () => {
    try {
      setJobStatus("processing");
      const res = await fetch("/api/clean-data", {
        method: "POST",
        body: JSON.stringify({ csv: rawCsv }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const data = await res.json();
      setIssues(data.issues);

      // Poll the backend for job status
      const checkJobStatus = setInterval(async () => {
        const statusRes = await fetch(`/api/job-status/${data.jobId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed") {
          clearInterval(checkJobStatus);
          setJobStatus("completed");
          setCleanedCsv(data.cleaned);
          setAfterData(data.cleaned); // Save the cleaned data as 'after' data for comparison
        }
      }, 2000); // Poll every 2 seconds
    } catch (error) {
      console.error("Error cleaning CSV:", error);
      setJobStatus("idle");
      setError("Failed to clean CSV data. Check if the server is running and API exists.");
    }
  };

  const issueCounts = {
    Duplicate: new Set(),
    Missing: 0,
    Invalid: 0,
  };

  issues.forEach((row) => {
    row.issues.forEach((issue) => {
      const lowered = issue.toLowerCase();
      if (lowered.includes("duplicate")) issueCounts.Duplicate.add(row.row);
      else if (lowered.includes("missing")) issueCounts.Missing++;
      else if (lowered.includes("invalid")) issueCounts.Invalid++;
    });
  });

  const chartData = [
    { name: "\uD83D\uDD01 Duplicate Rows", value: issueCounts.Duplicate.size },
    { name: "\uD83D\uDEAB Missing Values", value: issueCounts.Missing },
    { name: "\u274C Invalid Values", value: issueCounts.Invalid },
  ].filter((item) => item.value > 0);

  const COLORS = ["#EF4444", "#F59E0B", "#3B82F6"];

  const handleDownload = () => {
    const blob = new Blob([cleanedCsv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cleaned_data.csv";
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedCsv).then(() => {
      alert("Cleaned data copied to clipboard!");
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">Data Analyzer Tool</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="file-input file-input-bordered file-input-sm"
        />
        <button
          onClick={handleClean}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow-md transition-all"
          disabled={jobStatus === "processing"}
        >
          Analyze Data
        </button>
      </div>

      <div className="grid grid-cols-1">
        <div className="bg-white shadow-md rounded-lg p-4 border">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Original Data</h2>
          <pre className="whitespace-pre-wrap text-sm text-black bg-gray-100 rounded p-3 overflow-auto max-h-96">
            {rawCsv || "No CSV uploaded."}
          </pre>
        </div>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {issues.length > 0 && (
        <>
          <div className="mt-10 bg-white shadow-md rounded-lg p-6 border">
            <h2 className="text-red-600 text-xl font-bold mb-4">📊 Issue Summary</h2>
            <table className="min-w-full text-sm border">
              <thead className="bg-red-800 text-black">
                <tr>
                  <th className="border px-4 py-2 text-left">Issue Type</th>
                  <th className="border px-4 py-2 text-left">Count</th>
                </tr>
              </thead>
              <tbody className="text-black">
                <tr>
                  <td className="border px-4 py-2">🔁 Duplicate Rows</td>
                  <td className="border px-4 py-2">{issueCounts.Duplicate.size}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">🚫 Missing Values</td>
                  <td className="border px-4 py-2">{issueCounts.Missing}</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">❌ Invalid Values</td>
                  <td className="border px-4 py-2">{issueCounts.Invalid}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 bg-white shadow-md rounded-lg p-6 border">
            <h2 className="text-red-700 text-xl font-bold mb-4">Issues Found</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-red-700">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="border px-4 py-2">Row</th>
                    <th className="border px-4 py-2">Issues</th>
                    <th className="border px-4 py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-white">
                      <td className="border px-4 py-2 font-medium text-black">{issue.row}</td>
                      <td className="border px-4 py-2 text-black">
                        {issue.issues?.join(", ") || "No issues"}
                      </td>
                      <td className="border px-4 py-2 text-black text-center">
                        {issue.issues.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow-md border">
                <h2 className="text-lg font-bold text-blue-600 mb-4">Issue Summary (Pie Chart)</h2>
                <PieChart width={300} height={300}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              <div className="bg-white p-4 rounded shadow-md border">
                <h2 className="text-lg font-bold text-blue-600 mb-4">Issue Summary (Bar Chart)</h2>
                <BarChart width={400} height={300} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </div>
            </div>
          )}
        </>
      )}

      {jobStatus === "completed" && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-green-600 mb-4">Cleaning Complete!</h2>
          <h3 className="text-md text-blue-500 mb-4">Before vs After Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white shadow-md rounded-lg p-4 border">
              <h4 className="text-lg font-bold text-blue-600 mb-2">Before</h4>
              <pre className="whitespace-pre-wrap text-sm text-black bg-gray-100 rounded p-3 overflow-auto max-h-96">
                {beforeData || "No data"}
              </pre>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 border">
              <h4 className="text-lg font-bold text-blue-600 mb-2">After</h4>
              <pre className="whitespace-pre-wrap text-sm text-black bg-gray-100 rounded p-3 overflow-auto max-h-96">
                {afterData || "No data"}
              </pre>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg mr-4"
            >
              Download Cleaned Data
            </button>
            <button
              onClick={handleCopy}
              className="bg-gray-600 text-white font-bold px-4 py-2 rounded-lg"
            >
              Copy Cleaned Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
