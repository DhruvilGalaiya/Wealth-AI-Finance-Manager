"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error?.digest ? "An unexpected error occurred. Please try again." : error?.message}
      </p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
