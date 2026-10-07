"use client";

import { TriangleAlert } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <EmptyState
        icon={<TriangleAlert />}
        title="Something went wrong"
        description="This page failed to load. If it keeps happening, check that the database is reachable (MONGODB_URI)."
      >
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
      </EmptyState>
      {error.digest && <p className="pb-6 text-center font-mono text-xs text-subtle">Error ID: {error.digest}</p>}
    </Card>
  );
}
