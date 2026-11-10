"use client";

import { useEffect, useState, useCallback } from "react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
  className?: string;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownTimer({ expiresAt, onExpired, className }: CountdownTimerProps) {
  const calcRemaining = useCallback(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState<number>(calcRemaining());

  useEffect(() => {
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calcRemaining, onExpired]);

  const isUrgent = remaining > 0 && remaining <= 60;
  const isExpired = remaining <= 0;

  return (
    <div className={className}>
      <div
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-2xl font-bold transition-colors ${
          isExpired
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : isUrgent
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse"
            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        }`}
      >
        {isExpired ? (
          <span>EXPIRED</span>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDuration(remaining)}</span>
          </>
        )}
      </div>
    </div>
  );
}

