import type { Metadata } from "next";
import { Suspense } from "react";
import { createItem } from "@/actions/items";
import { ItemForm } from "@/components/item-form";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { listTopics } from "@/lib/data";

export const metadata: Metadata = { title: "New item" };

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New item" description="Add something you want to be able to answer in an interview." />
      <Card className="p-5 sm:p-8">
        <Suspense fallback={<Skeleton className="h-[560px]" />}>
          <NewItemForm />
        </Suspense>
      </Card>
    </div>
  );
}

async function NewItemForm() {
  const topics = await listTopics();
  return <ItemForm action={createItem} topics={topics} submitLabel="Save item" allowAddAnother />;
}
