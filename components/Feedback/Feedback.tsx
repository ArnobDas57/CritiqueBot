"use client";
import { useState } from "react";

export default function Feedback({ analysis }: { analysis: string }) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (header: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [header]: !prev[header],
    }));
  };

  const sections = analysis
    .split("\n")
    .reduce((acc: Record<string, string[]>, line) => {
      const trimmed = line.trim();
      const isHeader = /^[A-Z][\w\s&]+:/.test(trimmed);

      if (isHeader) {
        const header = trimmed.replace(":", "");
        acc[header] = [];
      } else if (Object.keys(acc).length > 0) {
        const lastKey = Object.keys(acc)[Object.keys(acc).length - 1];
        acc[lastKey].push(trimmed);
      }

      return acc;
    }, {});

  return (
    <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-purple-100 via-purple-50 to-white shadow-xl border border-purple-300 animate-fade-in-up transition-all duration-500">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
        <span className="animate-pulse">🧠</span> AI Resume Feedback
      </h2>

      {Object.entries(sections).map(([header, points]) => (
        <div
          key={header}
          className="mb-4 border rounded-lg bg-white shadow-sm overflow-hidden"
        >
          <button
            onClick={() => toggleSection(header)}
            className="w-full text-left px-4 py-3 font-semibold bg-purple-200 text-purple-900 hover:bg-purple-300 transition"
          >
            {expandedSections[header] ? "▼" : "▶"} {header}
          </button>
          {expandedSections[header] && (
            <div className="px-4 py-2 text-gray-800 space-y-2">
              {points.map((point, idx) => {
                const symbol =
                  point.includes("good") || point.includes("strong")
                    ? "✅"
                    : point.includes("improve") ||
                      point.includes("could be clearer")
                    ? "⚠️"
                    : point.includes("error") || point.includes("typo")
                    ? "❌"
                    : "•";
                return (
                  <p key={idx} className="text-sm sm:text-base">
                    <strong>{symbol}</strong> {point}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
