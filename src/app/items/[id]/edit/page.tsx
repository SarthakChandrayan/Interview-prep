import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateItem } from "@/app/actions";
import { ItemForm } from "@/components/item-form";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { getItem, listTopics } from "@/lib/data";

export const metadata: Metadata = { title: "Edit item" };

export default function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  return (
    <>
      <PageHeader title="Edit item" />
      <Card className="p-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <EditForm params={params} />
        </Suspense>
      </Card>
    </>
  );
}

async function EditForm({ params }: Pick<PageProps<"/items/[id]/edit">, "params">) {
  const { id } = await params;
  const [item, topics] = await Promise.all([getItem(id), listTopics()]);
  if (!item) notFound();

  return (
    <ItemForm
      action={updateItem.bind(null, item.id)}
      topics={topics}
      submitLabel="Save changes"
      defaults={{
        title: item.title,
        kind: item.kind,
        topic: item.topic,
        difficulty: item.difficulty ?? "",
        url: item.url,
        notes: item.notes,
        tags: item.tags.join(", "),
      }}
    />
  );
}
