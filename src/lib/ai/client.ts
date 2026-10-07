import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export const AI_MODEL = env.ANTHROPIC_MODEL;

export function isAiEnabled(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

let client: Anthropic | undefined;

export function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new AiUnavailableError();
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

// Server-side fallback re-runs a request on another model if a safety
// classifier declines it. Only these models accept the "default" form.
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);

export function fallbackParams() {
  if (!FALLBACK_MODELS.has(AI_MODEL)) return {};
  return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
}

export class AiUnavailableError extends Error {
  constructor() {
    super("AI features are turned off: set ANTHROPIC_API_KEY to enable them.");
  }
}

/** Turn SDK errors into a message that's safe and useful to show the user. */
export function describeAiError(err: unknown): { status: number; message: string } {
  if (err instanceof AiUnavailableError) return { status: 503, message: err.message };
  if (err instanceof Anthropic.AuthenticationError)
    return { status: 502, message: "The AI service rejected the API key. Check ANTHROPIC_API_KEY." };
  if (err instanceof Anthropic.RateLimitError)
    return { status: 429, message: "The AI service is rate limiting requests. Try again in a minute." };
  if (err instanceof Anthropic.BadRequestError)
    return { status: 502, message: "The AI service couldn't process this request." };
  if (err instanceof Anthropic.APIConnectionError)
    return { status: 502, message: "Couldn't reach the AI service. Check your connection and try again." };
  if (err instanceof Anthropic.APIError)
    return { status: 502, message: "The AI service is having trouble right now. Try again shortly." };
  return { status: 500, message: "Something went wrong." };
}
