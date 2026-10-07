import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "./ui";

/** Renders user notes and AI output. Raw HTML is not rendered (safe by default). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-app text-[15px]", className)}>
      <ReactMarkdown
        // remark-breaks keeps single line breaks, which is how people write notes.
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
