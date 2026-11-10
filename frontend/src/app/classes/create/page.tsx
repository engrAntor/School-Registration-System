"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClass, getErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, GraduationCap, AlertCircle } from "lucide-react";

export default function CreateClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [validationError, setValidationError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createClass({ name: name.trim(), totalSeats: parseInt(totalSeats, 10) }),
    onSuccess: (data) => {
      toast.success("Class Created Successfully!", {
        description: `"${data.name}" with ${data.totalSeats} seats is now available for applications.`,
      });
      router.push("/classes");
    },
    onError: (err) => {
      toast.error("Failed to Create Class", {
        description: getErrorMessage(err),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) {
      setValidationError("Class name is required.");
      return;
    }
    if (!totalSeats || parseInt(totalSeats, 10) <= 0) {
      setValidationError("Total seats must be a positive number.");
      return;
    }
    if (parseInt(totalSeats, 10) > 10000) {
      setValidationError("Total seats cannot exceed 10,000.");
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back button */}
      <Link
        href="/classes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Classes
      </Link>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Create New Class</CardTitle>
              <CardDescription>
                Add a new class with its shift and seat capacity.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                placeholder='e.g., "Class 6 - Morning Shift"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Each shift should be a separate class (e.g., &ldquo;Class 6 - Morning Shift&rdquo; and
                &ldquo;Class 6 - Day Shift&rdquo;).
              </p>
            </div>

            {/* Total Seats */}
            <div className="space-y-2">
              <Label htmlFor="total-seats">Total Seats</Label>
              <Input
                id="total-seats"
                type="number"
                placeholder="e.g., 120"
                min={1}
                max={10000}
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                disabled={mutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Maximum capacity for this class/shift.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 gap-2"
                size="lg"
              >
                {mutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Class
                  </>
                )}
              </Button>
              <Link href="/classes">
                <Button type="button" variant="outline" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

