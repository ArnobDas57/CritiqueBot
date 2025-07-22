"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType === "application/pdf" || fileType === "text/plain") {
        setFile(selectedFile);
      } else {
        alert("Please upload a PDF or TXT file");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10 px-4">
      <h1 className="text-6xl text-gray-800 font-bold mb-6">CritiqueBot</h1>

      <Label className="mt-15 text-xl text-blue-400">{`Upload your Resume (PDF or Text)`}</Label>
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
    </div>
  );
}
