"use client";

import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import SpotlightCard from "@/components/ui/SpotLightCard";
import Galaxy from "@/components/ui/Galaxy";
import Feedback from "@/components/Feedback/Feedback";

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

  // 🪄 Optional: Normalize analysis with basic formatting (just in case)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatAnalysis = (raw: any): string => {
    if (!raw) return "";
    if (typeof raw !== "string") raw = JSON.stringify(raw, null, 2);

    // Add line breaks after section headers if missing
    return raw
      .replace(
        /(CLARITY|IMPACT|KEYWORDS|FORMATTING|GRAMMAR|TARGETING|OVERALL EFFECTIVENESS)[:\-]*/gi,
        "\n\n$1:\n"
      )
      .replace(/\n{3,}/g, "\n\n") // avoid triple newlines
      .trim();
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
        const formatted = formatAnalysis(data.analysis);
        setAnalysis(formatted);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-10 flex flex-col items-center justify-start relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
        />
      </div>
      <div className="flex items-center justify-center mb-10 mt-5 gap-3">
        <Image
          src="/ai-resume-logo.png"
          width={60}
          height={60}
          alt="CritiqueBot logo"
          className="hover:scale-110 transition-transform duration-300 drop-shadow-lg rounded-md animate-fade-in-up"
        />
        <h1 className="text-5xl sm:text-6xl font-bold text-purple-100 drop-shadow-md animate-wave-text">
          CritiqueBot
        </h1>
      </div>

      <p className="text-purple-200 text-lg sm:text-xl max-w-xl my-5 animate-fade-in-up delay-200">
        Instantly get personalized AI feedback on your resume to stand out and
        get hired faster.
      </p>

      <SpotlightCard
        className="w-2/3 p-6 sm:p-10 rounded-xl border border-purple-800 bg-purple-950/70 shadow-xl backdrop-blur-md mt-5"
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
                multiple={false}
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
            disabled={!file || loading}
            className="relative inline-flex items-center justify-center px-6 py-3 w-full sm:w-auto text-white rounded-lg overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105 focus:outline-none "
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-[length:200%_200%] animate-gradient-slow group-hover:pointer-fine:* group-hover:animate-gradient-fast rounded-lg blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 font-semibold drop-shadow-md">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze Resume"
              )}
            </span>
          </button>

          {error && (
            <p className="text-red-500 font-medium text-sm sm:text-base">
              ❌ {error}
            </p>
          )}

          {analysis && <Feedback analysis={analysis} />}
        </div>
      </SpotlightCard>
    </div>
  );
}
