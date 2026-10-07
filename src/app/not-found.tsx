import { FileQuestion } from "lucide-react";
import { ButtonLink, Card, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="mx-auto mt-8 max-w-xl">
      <EmptyState icon={<FileQuestion />} title="Page not found" description="It may have been deleted, or the link is wrong.">
        <ButtonLink href="/" variant="secondary">
          Go to dashboard
        </ButtonLink>
      </EmptyState>
    </Card>
  );
}
