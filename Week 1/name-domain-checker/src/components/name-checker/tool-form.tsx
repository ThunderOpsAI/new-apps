"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AVAILABLE_COUNTRIES,
  AVAILABLE_EXTENSIONS,
  AVAILABLE_TONES,
} from "@/lib/types";

const industryOptions = [
  "SaaS",
  "Ecommerce",
  "Local service",
  "Agency",
  "Health",
  "Education",
  "Finance",
  "Creator business",
];

export function ToolForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([
    ".com",
    ".com.au",
    ".ai",
  ]);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const payload = {
      businessIdea: String(formData.get("businessIdea") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      tone: String(formData.get("tone") ?? ""),
      country: String(formData.get("country") ?? "Global"),
      email: String(formData.get("email") ?? ""),
      extensions: selectedExtensions,
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/name-checker/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          reportId?: string;
          error?: string;
        };

        if (!response.ok || !data.reportId) {
          throw new Error(data.error || "Unable to generate the report.");
        }

        router.push(`/tools/business-name-checker/results/${data.reportId}`);
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Something went wrong while generating your report.",
        );
      }
    });
  }

  function toggleExtension(extension: string) {
    setSelectedExtensions((current) => {
      if (current.includes(extension)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== extension);
      }

      return [...current, extension];
    });
  }

  return (
    <form action={handleSubmit} className="panel p-5 sm:p-7">
      <div className="grid gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="businessIdea">
            Business idea
          </label>
          <textarea
            className="textarea"
            id="businessIdea"
            name="businessIdea"
            placeholder="Example: AI proposal assistant for freelance designers who need faster, more professional client pitches."
            required
          />
          <p className="text-sm muted">
            20 to 500 characters. Keep it specific enough to shape the names.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="industry">
              Industry
            </label>
            <select className="select" id="industry" name="industry" required>
              <option value="">Select an industry</option>
              {industryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tone">
              Brand tone
            </label>
            <select className="select" id="tone" name="tone" required>
              <option value="">Select a tone</option>
              {AVAILABLE_TONES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="country">
              Country or market
            </label>
            <select
              className="select"
              defaultValue="Global"
              id="country"
              name="country"
            >
              {AVAILABLE_COUNTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email for the unlocked report
            </label>
            <input
              className="input"
              id="email"
              name="email"
              placeholder="Optional"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium">Preferred extensions</span>
          <div className="flex flex-wrap gap-3">
            {AVAILABLE_EXTENSIONS.map((extension) => {
              const checked = selectedExtensions.includes(extension);
              return (
                <button
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    checked
                      ? "border-transparent bg-[var(--accent)] text-white"
                      : "border-[var(--border)] bg-white/70 text-[var(--foreground)]"
                  }`}
                  key={extension}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleExtension(extension);
                  }}
                  type="button"
                >
                  {extension}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button className="button-primary w-full sm:w-auto" disabled={isPending} type="submit">
          {isPending ? "Generating your report..." : "Generate 20 names"}
        </button>
      </div>
    </form>
  );
}
