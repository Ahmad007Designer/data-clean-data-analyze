'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
  
      <h1 className="text-5xl font-bold text-center mb-12">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">

        {/* Data Cleaner */}
        <div
          className="cursor-pointer bg-white text-black shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all border border-gray-200"
          onClick={() => router.push('/api/cleaner_page')}
        >
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Data Cleaner</h2>
          <p className="text-gray-600">
            Upload and clean your CSV data. Automatically fix missing, invalid, or duplicate values.
          </p>
        </div>

        {/* Data Analyzer */}
        <div
          className="cursor-pointer bg-white text-black shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all border border-gray-200"
          onClick={() => router.push('/api/analyzer_page')}
        >
          <h2 className="text-2xl font-bold text-green-600 mb-2">Data Analyzer</h2>
          <p className="text-gray-600">
            Analyze your dataset and generate insights, summaries, and visualizations.
          </p>
        </div>
      </div>
    </div>
  );
}
