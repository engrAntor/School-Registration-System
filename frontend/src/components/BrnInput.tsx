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
    <div className="flex items-center gap-1.5 sm:gap-2">
      <User className="h-4 w-4 text-muted-foreground hidden lg:block shrink-0" />
      <div className="relative">
        <Input
          type="text"
          placeholder="17-digit BRN"
          value={value}
          onChange={handleChange}
          maxLength={17}
          className={`w-[150px] xs:w-[170px] sm:w-[210px] md:w-[230px] pr-8 font-mono text-xs sm:text-sm h-9 sm:h-10 transition-all ${
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
        <span className="text-xs text-amber-600 hidden xl:block shrink-0 whitespace-nowrap">
          {17 - value.length} digits left
        </span>
      )}
    </div>
  );
}

