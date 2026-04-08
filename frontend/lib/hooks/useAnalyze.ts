"use client";

import { useState } from "react";
import { analyzeImage, analyzePdf, analyzeText, scrapeUrl } from "@/lib/api";
import { AnalyzeResponse, InputMode } from "@/lib/types";

type AnalyzeError = {
  message: string;
};

export function useAnalyze() {
  const [activeTab, setActiveTab] = useState<InputMode>("text");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AnalyzeError | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [inputPulseKey, setInputPulseKey] = useState(0);

  const clearError = () => setError(null);
  const setErrorMessage = (message: string) => setError({ message });

  const resetAll = () => {
    setIsLoading(false);
    setError(null);
    setResult(null);
    setSelectedFile(null);
    setUrlInput("");
    setTextInput("");
    setInputPulseKey((value) => value + 1);
  };

  const setMode = (mode: InputMode) => {
    if (isLoading) {
      return;
    }

    setActiveTab(mode);
    setError(null);
  };

  const withSubmission = async (task: () => Promise<AnalyzeResponse>) => {
    setIsLoading(true);
    setError(null);
    setInputPulseKey((value) => value + 1);

    try {
      const response = await task();
      setResult(response);
      return response;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Something went wrong while analyzing.";
      setError({ message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitText = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError({ message: "Please paste a legal clause before analyzing." });
      return null;
    }

    return withSubmission(() => analyzeText(trimmed));
  };

  const submitFile = async (file: File, mode: "pdf" | "image") => {
    return withSubmission(() => (mode === "pdf" ? analyzePdf(file) : analyzeImage(file)));
  };

  const submitUrl = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError({ message: "Please enter a URL before analyzing." });
      return null;
    }

    return withSubmission(() => scrapeUrl(trimmed));
  };

  return {
    activeTab,
    setMode,
    isLoading,
    error,
    setErrorMessage,
    clearError,
    result,
    selectedFile,
    setSelectedFile,
    urlInput,
    setUrlInput,
    textInput,
    setTextInput,
    resetAll,
    submitText,
    submitFile,
    submitUrl,
    inputPulseKey
  };
}
