"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyHolds, getErrorMessage } from "@/lib/api";
import { getStudentId } from "@/lib/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoldStatusBadge } from "@/components/HoldStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Eye,
  AlertCircle,
  UserX,
  RefreshCw,
  BookOpen,
} from "lucide-react";

export default function MyApplicationsPage() {
  const [hasBrn, setHasBrn] = useState(false);

  useEffect(() => {
    setHasBrn(!!getStudentId());
  }, []);

  const {
    data: holds,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["myHolds"],
    queryFn: getMyHolds,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    enabled: hasBrn,
  });

  // Format expiry date for display
  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  // No BRN set
  if (!hasBrn) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="py-16 text-center">
          <CardContent>
            <UserX className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Student ID Required</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your 17-digit Birth Registration Number in the header to view your
              applications.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setHasBrn(!!getStudentId());
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              I&apos;ve entered my BRN
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track all your admission applications and their current status.
          </p>
        </div>
        <Link href="/classes">
          <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Classes
          </Button>
        </Link>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "10s" }} />
        <span>Status refreshes automatically every 10 seconds</span>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Applications</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {getErrorMessage(error)}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && holds?.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Applications Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven&apos;t applied for any classes yet. Browse available classes to get started.
            </p>
            <Link href="/classes">
              <Button className="mt-4 gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      {holds && holds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Applications ({holds.length})
            </CardTitle>
            <CardDescription>
              Click &ldquo;View Details&rdquo; to manage an application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Hold ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holds.map((hold) => (
                  <TableRow key={hold.holdId}>
                    <TableCell className="font-medium">{hold.className}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {hold.holdId}
                    </TableCell>
                    <TableCell>
                      <HoldStatusBadge status={hold.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatExpiry(hold.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/holds/${hold.holdId}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

