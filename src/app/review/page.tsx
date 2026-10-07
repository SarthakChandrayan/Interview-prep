import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewSession } from "@/components/review-session";
import { PageHeader, Skeleton } from "@/components/ui";
import { getReviewQueue } from "@/lib/data";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <>
      <PageHeader title="Review" />
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Queue />
      </Suspense>
    </>
  );
}

async function Queue() {
  const { items, total } = await getReviewQueue();
  return <ReviewSession items={items} remaining={total} />;
}
