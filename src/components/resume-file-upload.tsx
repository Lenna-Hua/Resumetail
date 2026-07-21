"use client";

import { useId, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { extractResumeText, isAcceptedResumeFile, RESUME_ACCEPT } from "@/lib/file-extract";
import { cn } from "@/lib/utils";

interface ResumeFileUploadProps {
  onExtracted: (text: string) => void;
  disabled?: boolean;
}

export function ResumeFileUpload({ onExtracted, disabled }: ResumeFileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    if (!isAcceptedResumeFile(file)) {
      setError("Use a .txt, .docx, or .pdf file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }

    setLoading(true);
    try {
      const text = await extractResumeText(file);
      if (text.length < 40) {
        throw new Error("Could not extract enough text. Try pasting manually or use a different file.");
      }
      onExtracted(text);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={RESUME_ACCEPT}
        className="hidden"
        disabled={disabled || loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <label
        htmlFor={inputId}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "flex min-h-11 w-full max-w-full cursor-pointer px-3 py-2",
          (disabled || loading) && "pointer-events-none opacity-50",
        )}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" />
            <span className="truncate">Extracting…</span>
          </>
        ) : (
          <>
            <FileUp className="size-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Upload resume file</span>
              <span className="hidden sm:inline">Upload resume (.txt, .docx, .pdf)</span>
            </span>
          </>
        )}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && !error && (
        <p className="text-xs text-primary">Resume text extracted — review below, then create.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Parsed in your browser — files are not uploaded to our servers. Try{" "}
        <a href="/samples/sample-resume.txt" className="underline underline-offset-2">
          sample-resume.txt
        </a>{" "}
        to test upload.
      </p>
    </div>
  );
}
