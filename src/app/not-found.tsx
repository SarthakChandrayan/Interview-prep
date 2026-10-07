import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-zinc-500">That item doesn&apos;t exist, or it was deleted.</p>
      <Link href="/items" className={`${buttonStyles.secondary} mt-6 inline-block`}>
        Back to library
      </Link>
    </div>
  );
}
