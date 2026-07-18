"use client";

import { useState, useTransition } from "react";

type UnlockButtonProps = {
  reportId: string;
};

export function UnlockButton({ reportId }: UnlockButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/name-checker/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, plan: "one_off" }),
        });

        const data = (await response.json()) as { checkoutUrl?: string; error?: string };
        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error || "Unable to start checkout.");
        }

        window.location.href = data.checkoutUrl;
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to start checkout.",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <button className="button-primary" disabled={isPending} onClick={handleClick} type="button">
        {isPending ? "Preparing checkout..." : "Unlock full report for $9"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
