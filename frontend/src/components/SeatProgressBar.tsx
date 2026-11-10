"use client";

import { cn } from "@/lib/utils";

interface SeatProgressBarProps {
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  className?: string;
}

export function SeatProgressBar({
  totalSeats,
  heldSeats,
  confirmedSeats,
  availableSeats,
  className,
}: SeatProgressBarProps) {
  const confirmedPct = totalSeats > 0 ? (confirmedSeats / totalSeats) * 100 : 0;
  const heldPct = totalSeats > 0 ? (heldSeats / totalSeats) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className="flex h-full">
          <div
            className="bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${confirmedPct}%` }}
          />
          <div
            className="bg-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${heldPct}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Confirmed: {confirmedSeats}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Held: {heldSeats}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          Available: {availableSeats}
        </span>
      </div>
    </div>
  );
}

