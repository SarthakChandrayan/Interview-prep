import { describe, expect, it } from "vitest";
import type { BetaContentBlock } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { replayableContent, textOf } from "./content";

const blocks = (...b: object[]) => b as unknown as BetaContentBlock[];

describe("textOf", () => {
  it("joins text blocks and ignores thinking", () => {
    expect(
      textOf(blocks({ type: "thinking", thinking: "", signature: "s" }, { type: "text", text: "Hi " }, { type: "text", text: "there" })),
    ).toBe("Hi there");
  });
});

describe("replayableContent", () => {
  it("keeps everything when no fallback happened", () => {
    const b = blocks({ type: "thinking", thinking: "", signature: "s" }, { type: "text", text: "Hi" });
    expect(replayableContent(b)).toBe(b);
  });

  it("drops the declined model's thinking before the fallback marker", () => {
    const b = blocks(
      { type: "thinking", thinking: "", signature: "a" },
      { type: "text", text: "partial" },
      { type: "fallback" },
      { type: "thinking", thinking: "", signature: "b" },
      { type: "text", text: "rest" },
    );
    expect(replayableContent(b).map((x) => x.type)).toEqual(["text", "fallback", "thinking", "text"]);
  });
});
