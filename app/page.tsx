"use client";

import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import SpotlightCard from "@/components/ui/SpotLightCard";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType === "application/pdf" || fileType === "text/plain") {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please upload a PDF or TXT file");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setLoading(true);
    setAnalysis("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_role", jobRole);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 py-12 px-4 flex flex-col items-center justify-start">
      <div className="flex items-center justify-center mb-10 gap-3">
        <Image
          src="/ai-resume-logo.png"
          width={60}
          height={60}
          alt="CritiqueBot logo"
        />
        <h1 className="text-5xl sm:text-6xl font-bold text-purple-100 drop-shadow-md">
          CritiqueBot
        </h1>
      </div>

      <SpotlightCard
        className="w-full max-w-2xl p-6 sm:p-10 rounded-xl border border-purple-800 bg-purple-950/70 shadow-xl backdrop-blur-md"
        spotlightColor="rgba(198, 182, 247, 0.3)"
      >
        <div className="flex flex-col space-y-6">
          <div>
            <Label className="text-lg font-medium text-purple-100">
              Upload Your Resume (PDF or TXT)
            </Label>
            <label
              htmlFor="file-upload"
              className="mt-2 block w-full text-center cursor-pointer px-6 py-4 border-2 border-dashed border-purple-400 rounded-lg text-purple-100 hover:border-purple-500 hover:bg-purple-800/30 transition-all"
            >
              <p className="text-sm sm:text-base">
                Click or drag a <span className="font-semibold">PDF</span> or{" "}
                <span className="font-semibold">TXT</span> file to upload
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="mt-2 text-green-400 text-sm">
                ✅ Uploaded: {file.name}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Optional job role (e.g., Frontend Developer)"
              className="w-full px-4 py-2 rounded-md bg-slate-800 text-purple-100 border border-purple-500 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 w-full sm:w-auto bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {error && (
            <p className="text-red-500 font-medium text-sm sm:text-base">
              ❌ {error}
            </p>
          )}

          {analysis && (
            <div className="mt-6 p-4 bg-slate-100 text-gray-800 rounded-lg shadow-inner max-h-[400px] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-3 text-purple-800">
                🧠 AI Resume Feedback
              </h2>
              <pre className="whitespace-pre-wrap text-sm sm:text-base">
                {analysis}
              </pre>
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}
