import type { Metadata } from "next";
import { Suspense } from "react";
import { createItem } from "@/app/actions";
import { ItemForm } from "@/components/item-form";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { listTopics } from "@/lib/data";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <>
      <PageHeader title="Add item" />
      <Card className="p-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <NewItemForm />
        </Suspense>
      </Card>
    </>
  );
}

async function NewItemForm() {
  const topics = await listTopics();
  return <ItemForm action={createItem} topics={topics} submitLabel="Save" allowAddAnother />;
}
