"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-col items-center justify-center mt-10 px-4">
      <h1 className="text-6xl text-gray-800 font-bold mb-6">CritiqueBot</h1>

      <Label className="mt-15 text-xl text-blue-400">
        {`Upload your Resume (PDF or Text)`}
      </Label>
      <label
        htmlFor="file-upload"
        className="cursor-pointer px-6 py-4 mt-5 border-2 border-dashed border-gray-400 rounded-lg text-center hover:border-blue-500 transition-all"
      >
        <p className="mb-2 text-gray-600">
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
        <p className="mt-4 text-green-700 font-medium">Uploaded: {file.name}</p>
      )}

      <input
        type="text"
        placeholder="Optional job role (e.g., Frontend Developer)"
        className="mt-6 px-4 py-2 border rounded-md w-full max-w-md"
        value={jobRole}
        onChange={(e) => setJobRole(e.target.value)}
      />

      <button
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {error && <p className="mt-4 text-red-600 font-medium">❌ {error}</p>}

      {analysis && (
        <div className="mt-10 p-6 border rounded-lg max-w-3xl w-full bg-gray-50 shadow">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">
            🧠 AI Resume Feedback
          </h2>
          <pre className="whitespace-pre-wrap text-gray-800">{analysis}</pre>
        </div>
      )}
    </div>
  );
}
