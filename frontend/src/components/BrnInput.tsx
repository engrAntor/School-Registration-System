"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getStudentId, setStudentId, isValidBrn } from "@/lib/storage";
import { CheckCircle2, User } from "lucide-react";

export function BrnInput() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getStudentId();
    if (stored) {
      setValue(stored);
      setSaved(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 17);
    setValue(v);
    if (isValidBrn(v)) {
      setStudentId(v);
      setSaved(true);
    } else {
      setSaved(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <div className="relative">
        <Input
          type="text"
          placeholder="17-digit Birth Reg. No."
          value={value}
          onChange={handleChange}
          maxLength={17}
          className={`w-[220px] pr-8 font-mono text-sm ${
            saved
              ? "border-emerald-500 focus-visible:ring-emerald-500"
              : value.length > 0
              ? "border-amber-400 focus-visible:ring-amber-400"
              : ""
          }`}
        />
        {saved && (
          <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        )}
      </div>
      {value.length > 0 && !saved && (
        <span className="text-xs text-amber-600 hidden md:block">{17 - value.length} digits remaining</span>
      )}
    </div>
  );
}
