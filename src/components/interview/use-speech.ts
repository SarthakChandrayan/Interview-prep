"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

// The Web Speech API isn't in TypeScript's DOM lib yet; describe the bits we use.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type Ctor = new () => SpeechRecognitionLike;

const noopSubscribe = () => () => {};

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text (free, runs in Chrome/Edge/Safari). Calls `onFinal`
 * with each finished phrase; `interim` holds the phrase being spoken.
 */
export function useSpeech(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  useLayoutEffect(() => {
    onFinalRef.current = onFinal;
  });

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const C = getCtor();
    if (!C) return;
    setError(null);
    const r = new C();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    r.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinalRef.current(res[0].transcript.trim());
        else pending += res[0].transcript;
      }
      setInterim(pending);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Microphone access was blocked.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setError("Voice input stopped unexpectedly.");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    r.start();
    setListening(true);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
