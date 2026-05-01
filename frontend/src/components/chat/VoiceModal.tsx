"use client";

import { useEffect, useRef, Component } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, RotateCcw, X, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useVoiceInput } from "@/hooks/useVoiceInput";

// Error Boundary Component
class ErrorBoundary extends Component<{children: React.ReactNode; fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode; fallback: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('VoiceOrb render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Dynamically import the 3D orb to avoid SSR issues with Three.js
const VoiceOrb = dynamic(() => import("./VoiceOrb").catch(() => ({ default: () => null })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-24 h-24 rounded-full animate-pulse"
        style={{ background: "var(--sc-gradient)" }}
      />
    </div>
  ),
});

interface VoiceModalProps {
  isOpen: boolean;
  onClose: (transcript: string) => void;
}

export default function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  const hasStopped = useRef(false);

  // Clean up if modal closes externally
  useEffect(() => {
    if (!isOpen) {
      if (isListening) stopListening();
      hasStopped.current = false;
    }
  }, [isOpen]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    if (isListening) stopListening();
    resetTranscript();
  };

  const handleClose = () => {
    const final = isListening ? stopListening() : transcript;
    onClose(final);
  };

  const displayText = interimTranscript || transcript;
  const isNothing = !displayText;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="voice-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={handleClose}
          />

          {/* Modal — full-screen on mobile, centered card on desktop */}
          <motion.div
            key="voice-modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col
              md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              md:w-[380px] md:max-h-[640px] md:rounded-3xl md:overflow-hidden"
            style={{
              background: "rgba(0,0,0,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(147,51,234,0.15)",
            }}
          >
            {/* Header bar */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-2">
              <button
                id="voice-modal-back"
                onClick={handleClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-white">Voice Input</span>
            </div>

            {/* 3D Orb — flex-1 area */}
            <div className="flex-1 flex items-center justify-center px-6 min-h-0">
              <div className="w-full" style={{ height: "clamp(200px, 45vh, 320px)" }}>
                <ErrorBoundary fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="w-24 h-24 rounded-full animate-pulse"
                      style={{ background: "var(--sc-gradient)" }}
                    />
                  </div>
                }>
                  <VoiceOrb isListening={isListening} audioLevel={audioLevel} />
                </ErrorBoundary>
              </div>
            </div>

            {/* Transcript area */}
            <div className="px-6 py-4 min-h-[90px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isNothing ? (
                  <motion.p
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-base"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {isListening ? "Listening..." : "Tap the mic to start speaking"}
                  </motion.p>
                ) : (
                  <motion.p
                    key="transcript"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`text-center text-base font-medium max-w-xs leading-relaxed
                      ${isListening ? "typewriter-cursor" : ""}`}
                    style={{
                      color: interimTranscript ? "rgba(255,255,255,0.7)" : "#ffffff",
                    }}
                  >
                    {displayText}
                    {!transcript && !interimTranscript && (
                      <span style={{ color: "rgba(147,51,234,0.5)" }}> for SmartChat</span>
                    )}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom actions bar */}
            <div className="flex items-center justify-center gap-6 px-6 pb-10 pt-2">
              {/* Reset */}
              <button
                id="voice-modal-reset"
                onClick={handleReset}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                  hover:opacity-80 active:scale-95"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                aria-label="Reset transcript"
              >
                <RotateCcw size={18} />
              </button>

              {/* Mic — center, larger */}
              <motion.button
                id="voice-modal-mic"
                onClick={handleMicToggle}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-200
                  active:scale-95"
                style={
                  isListening
                    ? { background: "linear-gradient(135deg, #7C3AED, #EC4899)" }
                    : { background: "rgba(255,255,255,0.1)" }
                }
                animate={
                  isListening
                    ? {
                        boxShadow: [
                          "0 0 0 0px rgba(124, 58, 237, 0.6)",
                          "0 0 0 16px rgba(124, 58, 237, 0)",
                        ],
                      }
                    : { boxShadow: "0 0 0 0px rgba(124, 58, 237, 0)" }
                }
                transition={{ duration: 1.2, repeat: isListening ? Infinity : 0 }}
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                <Mic size={24} />
              </motion.button>

              {/* Close / Done */}
              <button
                id="voice-modal-close"
                onClick={handleClose}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                  hover:opacity-80 active:scale-95"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                aria-label="Close voice input"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
