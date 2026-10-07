import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewSession } from "@/components/review-session";
import { PageHeader, Skeleton } from "@/components/ui";
import { isAiEnabled } from "@/lib/ai/client";
import { getReviewQueue } from "@/lib/data";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <>
      <PageHeader title="Review" description="Answer out loud first, then reveal your notes and grade how well you remembered." />
      <Suspense fallback={<Skeleton className="mx-auto h-[420px] max-w-3xl" />}>
        <Queue />
      </Suspense>
    </>
  );
}

async function Queue() {
  const { items, total } = await getReviewQueue();
  return <ReviewSession items={items} remaining={total} aiEnabled={isAiEnabled()} />;
}
