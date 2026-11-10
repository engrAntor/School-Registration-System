"use client";

import { Badge } from "@/components/ui/badge";
import type { HoldStatus } from "@/lib/types";
import { CheckCircle2, Clock, XCircle, Ban } from "lucide-react";

interface HoldStatusBadgeProps {
  status: HoldStatus;
  className?: string;
}

const statusConfig: Record<HoldStatus, {
  variant: "success" | "warning" | "danger" | "secondary";
  label: string;
  icon: React.ElementType;
}> = {
  HELD: { variant: "warning", label: "Held", icon: Clock },
  CONFIRMED: { variant: "success", label: "Confirmed", icon: CheckCircle2 },
  EXPIRED: { variant: "danger", label: "Expired", icon: XCircle },
  CANCELLED: { variant: "secondary", label: "Cancelled", icon: Ban },
};

export function HoldStatusBadge({ status, className }: HoldStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

