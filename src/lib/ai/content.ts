import type { BetaContentBlock } from "@anthropic-ai/sdk/resources/beta/messages/messages";

/** Visible text of an assistant turn. */
export function textOf(blocks: BetaContentBlock[]): string {
  return blocks
    .filter((b): b is Extract<BetaContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

const DROP_BEFORE_FALLBACK = new Set(["thinking", "redacted_thinking", "tool_use"]);

/**
 * Prepare an assistant turn for replay. If a server-side fallback happened
 * mid-output, the declined model's thinking and tool-use blocks before the
 * last `fallback` marker must not be echoed back. Everything else is kept
 * verbatim, which keeps the history append-only.
 */
export function replayableContent(blocks: BetaContentBlock[]): BetaContentBlock[] {
  const lastFallback = blocks.findLastIndex((b) => b.type === "fallback");
  if (lastFallback === -1) return blocks;
  return blocks.filter((b, i) => i > lastFallback || !DROP_BEFORE_FALLBACK.has(b.type));
}
