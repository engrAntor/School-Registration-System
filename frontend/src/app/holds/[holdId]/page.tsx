"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHold, getClass, confirmHold, cancelHold, getErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoldStatusBadge } from "@/components/HoldStatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  ArrowLeft,
  CreditCard,
  XCircle,
  AlertCircle,
  GraduationCap,
  Clock,
  Hash,
  BookOpen,
} from "lucide-react";
import type { HoldStatus } from "@/lib/types";

export default function HoldDetailPage() {
  const params = useParams();
  const holdId = params.holdId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<HoldStatus | null>(null);

  // Fetch hold details — auto-poll every 10s to stay in sync
  const {
    data: hold,
    isLoading: holdLoading,
    isError: holdError,
    error: holdErr,
    refetch: refetchHold,
  } = useQuery({
    queryKey: ["hold", holdId],
    queryFn: () => getHold(holdId),
    refetchInterval: 10000,
    enabled: !!holdId,
  });

  // Fetch class info based on hold's classId
  const { data: classInfo } = useQuery({
    queryKey: ["class", hold?.classId],
    queryFn: () => getClass(hold!.classId),
    enabled: !!hold?.classId,
  });

  const currentStatus = localStatus || hold?.status;

  // Confirm (Pay Fee) mutation
  const confirmMutation = useMutation({
    mutationFn: () => confirmHold(holdId),
    onSuccess: () => {
      setLocalStatus("CONFIRMED");
      toast.success("Admission Confirmed!", {
        description: "Your admission fee has been paid and your seat is confirmed.",
      });
      queryClient.invalidateQueries({ queryKey: ["hold", holdId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => {
      toast.error("Confirmation Failed", { description: getErrorMessage(err) });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelHold(holdId),
    onSuccess: () => {
      setLocalStatus("CANCELLED");
      toast.success("Application Cancelled", {
        description: "Your application has been cancelled and the seat has been released.",
      });
      queryClient.invalidateQueries({ queryKey: ["hold", holdId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => {
      toast.error("Cancellation Failed", { description: getErrorMessage(err) });
    },
  });

  // Called by CountdownTimer when timer reaches zero
  const handleExpired = useCallback(() => {
    setLocalStatus("EXPIRED");
    queryClient.invalidateQueries({ queryKey: ["hold", holdId] });
    queryClient.invalidateQueries({ queryKey: ["classes"] });
  }, [holdId, queryClient]);

  const isActionable = currentStatus === "HELD";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Applications
        </Link>
        <Link
          href="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Browse Classes
        </Link>
      </div>

      {/* Error State */}
      {holdError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Application</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {getErrorMessage(holdErr)}
            <Button variant="outline" size="sm" onClick={() => refetchHold()} className="ml-2">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {holdLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hold Details Card */}
      {hold && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Application Details</CardTitle>
                <CardDescription className="mt-1">
                  Review your application status and take action
                </CardDescription>
              </div>
              <HoldStatusBadge status={currentStatus || hold.status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Info Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Hold ID</p>
                  <p className="font-mono text-sm font-semibold">{hold.holdId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Class</p>
                  <p className="text-sm font-semibold">
                    {classInfo?.name || hold.classId}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown Timer — only show for HELD status */}
            {currentStatus === "HELD" && hold.expiresAt && (
              <div className="rounded-xl border-2 border-dashed border-primary/30 p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Time Remaining to Pay Fee
                </div>
                <CountdownTimer expiresAt={hold.expiresAt} onExpired={handleExpired} />
                <p className="mt-2 text-xs text-muted-foreground">
                  If the fee is not paid before the timer expires, your seat will be released.
                </p>
              </div>
            )}

            {/* Expired notice */}
            {currentStatus === "EXPIRED" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Application Expired</AlertTitle>
                <AlertDescription>
                  The hold period has ended. Your seat has been released back into the
                  available pool. You may re-apply if seats are still available.
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmed notice */}
            {currentStatus === "CONFIRMED" && (
              <Alert variant="success">
                <GraduationCap className="h-4 w-4" />
                <AlertTitle>Admission Confirmed!</AlertTitle>
                <AlertDescription>
                  Your admission fee has been paid and your seat is permanently confirmed.
                  Congratulations!
                </AlertDescription>
              </Alert>
            )}

            {/* Cancelled notice */}
            {currentStatus === "CANCELLED" && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertTitle>Application Cancelled</AlertTitle>
                <AlertDescription>
                  You cancelled this application. The seat has been released.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={!isActionable || confirmMutation.isPending || cancelMutation.isPending}
                variant="success"
                size="lg"
                className="flex-1 gap-2"
              >
                {confirmMutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay Fee &amp; Confirm
                  </>
                )}
              </Button>
              <Button
                onClick={() => cancelMutation.mutate()}
                disabled={!isActionable || confirmMutation.isPending || cancelMutation.isPending}
                variant="destructive"
                size="lg"
                className="flex-1 gap-2"
              >
                {cancelMutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Cancel Application
                  </>
                )}
              </Button>
            </div>

            {/* Navigate to classes */}
            <div className="text-center pt-2">
              <Link href="/classes" className="text-sm text-primary hover:underline">
                ← Browse all classes
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

