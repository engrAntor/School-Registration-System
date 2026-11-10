"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClasses, createHold, getErrorMessage } from "@/lib/api";
import { getStudentId } from "@/lib/storage";
import type { SchoolClass } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeatProgressBar } from "@/components/SeatProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Armchair,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function ClassesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: classes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: listClasses,
    refetchInterval: 5000, // Auto-refresh every 5 seconds per spec
  });

  const applyMutation = useMutation({
    mutationFn: (classId: string) => createHold(classId),
    onSuccess: (data) => {
      toast.success("Application submitted! Seat held successfully.", {
        description: `Hold ID: ${data.holdId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push(`/holds/${data.holdId}`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      toast.error("Application Failed", { description: msg });
    },
  });

  const handleApply = (classId: string) => {
    const brn = getStudentId();
    if (!brn) {
      toast.error("Student ID Required", {
        description: "Please enter your 17-digit Birth Registration Number in the header first.",
      });
      return;
    }
    applyMutation.mutate(classId);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Available Classes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Browse classes and apply for admission. Seats update automatically.
          </p>
        </div>
        <Link href="/classes/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </Link>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "5s" }} />
        <span>Seat counts refresh automatically every 5 seconds</span>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Classes</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {getErrorMessage(error)}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-3 w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && classes?.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Classes Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No classes have been created yet. School admins can create classes using the button above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class Cards Grid */}
      {classes && classes.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls: SchoolClass) => (
            <Card key={cls.id} className="flex flex-col overflow-hidden">
              {/* Class Header */}
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Capacity: {cls.totalSeats} seats
                </p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                {/* Seat Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
                    <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {cls.confirmedSeats}
                    </p>
                    <p className="text-[10px] uppercase text-emerald-600/70">Confirmed</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
                    <Clock className="mx-auto mb-1 h-4 w-4 text-amber-600" />
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {cls.heldSeats}
                    </p>
                    <p className="text-[10px] uppercase text-amber-600/70">Held</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                    <Armchair className="mx-auto mb-1 h-4 w-4 text-blue-600" />
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {cls.availableSeats}
                    </p>
                    <p className="text-[10px] uppercase text-blue-600/70">Available</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <SeatProgressBar
                  totalSeats={cls.totalSeats}
                  heldSeats={cls.heldSeats}
                  confirmedSeats={cls.confirmedSeats}
                  availableSeats={cls.availableSeats}
                />

                {/* Apply Button */}
                <div className="mt-auto pt-2">
                  <Button
                    onClick={() => handleApply(cls.id)}
                    disabled={cls.availableSeats <= 0 || applyMutation.isPending}
                    className="w-full gap-2"
                    variant={cls.availableSeats > 0 ? "default" : "secondary"}
                    size="lg"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : cls.availableSeats <= 0 ? (
                      <>
                        <Users className="h-4 w-4" />
                        No Seats Available
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4" />
                        Apply Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

