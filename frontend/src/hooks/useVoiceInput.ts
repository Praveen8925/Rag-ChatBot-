"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Browser Web Speech API type declarations ──────────────────────────────────
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

// ──────────────────────────────────────────────────────────────────────────────

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  isSupported: boolean;
}

interface VoiceInputActions {
  startListening: () => void;
  stopListening: () => string;
  resetTranscript: () => void;
}

export function useVoiceInput(): VoiceInputState & VoiceInputActions {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef<string>("");

  const clearAudioLevelInterval = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor =
      (win["SpeechRecognition"] || win["webkitSpeechRecognition"]) as
        | SpeechRecognitionConstructor
        | undefined;

    if (!SpeechRecognitionCtor) return;

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalChunk) {
        finalTranscriptRef.current += finalChunk + " ";
        setTranscript(finalTranscriptRef.current.trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error("SpeechRecognition error:", event.error);
      setIsListening(false);
      clearAudioLevelInterval();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      clearAudioLevelInterval();
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
      clearAudioLevelInterval();
    };
  }, [clearAudioLevelInterval]);

  const startAudioLevel = useCallback(() => {
    clearAudioLevelInterval();
    audioLevelIntervalRef.current = setInterval(() => {
      setAudioLevel(0.3 + Math.random() * 0.7);
    }, 150);
  }, [clearAudioLevelInterval]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
    startAudioLevel();
  }, [isListening, startAudioLevel]);

  const stopListening = useCallback((): string => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setAudioLevel(0);
    clearAudioLevelInterval();
    return finalTranscriptRef.current.trim();
  }, [isListening, clearAudioLevelInterval]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
