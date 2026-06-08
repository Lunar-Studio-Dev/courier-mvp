import { createWorker } from "tesseract.js";

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const worker = await createWorker("eng", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const {
    data: { text },
  } = await worker.recognize(file);

  await worker.terminate();
  return text;
}
