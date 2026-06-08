"use client";

import { useState, useCallback } from "react";
import type { ParsedIDResult } from "~/lib/ocr/types";
import { extractTextFromImage } from "~/lib/ocr";
import { autoDetectAndParse } from "~/lib/ocr/parsers";

export function useIdOcr() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (file: File): Promise<ParsedIDResult | null> => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const text = await extractTextFromImage(file, setProgress);
        const result = autoDetectAndParse(text);
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "OCR processing failed",
        );
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { processImage, isProcessing, progress, error };
}
