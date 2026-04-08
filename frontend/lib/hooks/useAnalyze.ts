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
  const [isDemoRunning, setIsDemoRunning] = useState(false);

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

  const runDemoMode = async () => {
    if (isDemoRunning) {
      return;
    }

    const demos: Array<{ clause: string; output: string }> = [
      {
        clause: "The lessee shall not sublet or assign the premises without prior written consent of the lessor.",
        output: "You cannot give your flat to someone else without your landlord's written permission."
      },
      {
        clause: "The lessor reserves the right to terminate this agreement with 30 days notice in case of breach.",
        output: "Your landlord can end this agreement by giving you 30 days written notice."
      },
      {
        clause: "The entire security deposit may be forfeited at the sole discretion of the Licensor.",
        output: "Your landlord can keep your entire deposit for any reason they choose."
      }
    ];

    setIsDemoRunning(true);
    setMode("text");
    setError(null);

    try {
      for (const demo of demos) {
        setTextInput(demo.clause);
        setIsLoading(true);
        setInputPulseKey((value) => value + 1);

        await new Promise((resolve) => {
          window.setTimeout(resolve, 600);
        });

        setResult({
          source_type: "text",
          file_name: null,
          extracted_text: demo.clause,
          plain_english: demo.output,
          key_points: [demo.clause],
          risk_score: demo.clause.toLowerCase().includes("forfeit") ? 80 : demo.clause.toLowerCase().includes("terminate") ? 45 : 25,
          risk_level: demo.clause.toLowerCase().includes("forfeit") ? "High Risk" : demo.clause.toLowerCase().includes("terminate") ? "Medium Risk" : "Low Risk",
          reasons: demo.clause.toLowerCase().includes("forfeit")
            ? ["Deposit taken without reason", "Landlord has unchecked power"]
            : demo.clause.toLowerCase().includes("terminate")
              ? ["Agreement can end early", "Breaking rules has consequences"]
              : ["Restriction on subletting found"],
          flags: [],
          warnings: []
        });

        setIsLoading(false);

        await new Promise((resolve) => {
          window.setTimeout(resolve, 3000);
        });
      }
    } finally {
      setIsLoading(false);
      setIsDemoRunning(false);
    }
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
    inputPulseKey,
    runDemoMode,
    isDemoRunning
  };
}
