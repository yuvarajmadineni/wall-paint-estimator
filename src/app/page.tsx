"use client";
import React, { useState, useRef } from "react";

export default function HomePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{
    width: number;
    height: number;
    cost: number;
  } | null>(null);
  const [objectDetection, setObjectDetection] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    setError("");
    setResult(null);
    setObjectDetection(null);
    const formData = new FormData();
    formData.append("image", image);
    try {
      const res = await fetch("/api/analyze-wall", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze image");
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleObjectDetection = async () => {
    if (!image) return;
    setLoading(true);
    setError("");
    setObjectDetection(null);
    const formData = new FormData();
    formData.append("image", image);
    try {
      const res = await fetch("/api/object-localization", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to detect objects");
      setObjectDetection(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl text-black font-bold mb-6 text-center">
        Wall Painting Cost Estimator
      </h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-6 w-full max-w-md"
      >
        <div
          className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors duration-200 bg-white cursor-pointer ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onClick={handleBrowseClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={0}
          role="button"
          aria-label="Upload wall image"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={inputRef}
            className="hidden"
            required={!image}
          />
          {preview ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded shadow mb-2 object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs text-red-600 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-blue-400 mb-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16.5 12.75L12 17.25m0 0l-4.5-4.5M12 17.25V4.5"
                />
              </svg>
              <span className="text-gray-500 text-center">
                Drag & drop an image here, or{" "}
                <span className="text-blue-600 underline">browse</span>
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2 w-full">
          <button
            type="submit"
            disabled={loading || !image}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Upload & Estimate"}
          </button>
          <button
            type="button"
            onClick={handleObjectDetection}
            disabled={loading || !image}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Detecting..." : "Object Detection"}
          </button>
        </div>
      </form>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {result && (
        <div className="mt-8 p-4 border rounded bg-white shadow max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2 text-black">Estimation Result</h2>
          <p className="text-black">Width: {result.width} feet</p>
          <p className="text-black">Height: {result.height} feet</p>
          <p className="font-bold mt-2 text-black">
            Estimated Cost: ${result.cost.toFixed(2)}
          </p>
        </div>
      )}
      {objectDetection && (
        <div className="mt-8 p-4 border rounded bg-white shadow max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2 text-black">Object Detection Predictions</h2>
          <pre className="text-sm text-black overflow-auto whitespace-pre-wrap">
            {JSON.stringify(objectDetection, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
