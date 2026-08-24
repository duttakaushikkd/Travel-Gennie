"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { InputGroupButton } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceTalkButtonProps = {
  disabled?: boolean;
  onError?: (message: string | undefined) => void;
  onListeningChange?: (listening: boolean) => void;
  onSend: (transcript: string) => void | Promise<void>;
};

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function transcriptFromResults(results: ArrayLike<SpeechRecognitionResultLike>): string {
  let text = "";
  for (let index = 0; index < results.length; index += 1) {
    text += results[index]?.[0]?.transcript ?? "";
  }
  return text.trim();
}

function errorMessageForCode(code: string): string | undefined {
  switch (code) {
    case "aborted":
      return undefined;
    case "not-allowed":
      return "Microphone access was blocked. Allow the mic to use press-to-talk.";
    case "no-speech":
      return "No speech was heard. Tap the mic and try again.";
    case "network":
      return "Voice recognition lost its connection. Check your network and try again.";
    case "service-not-allowed":
      return "Voice input is not available in this browser.";
    default:
      return "Voice input failed. Try again or type your message.";
  }
}

export function VoiceTalkButton({
  disabled = false,
  onError,
  onListeningChange,
  onSend,
}: VoiceTalkButtonProps) {
  const [listening, setListening] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef("");
  const listeningRef = useRef(false);
  const shouldSendRef = useRef(false);
  const savedTextareaRef = useRef("");
  const onErrorRef = useRef(onError);
  const onListeningChangeRef = useRef(onListeningChange);
  const onSendRef = useRef(onSend);

  onErrorRef.current = onError;
  onListeningChangeRef.current = onListeningChange;
  onSendRef.current = onSend;

  const setListeningState = useCallback((next: boolean) => {
    listeningRef.current = next;
    setListening(next);
    onListeningChangeRef.current?.(next);
  }, []);

  const writePreview = useCallback((text: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'form textarea[name="message"]',
    );
    if (!textarea) {
      return;
    }
    textarea.value = text;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }, []);

  const finishListening = useCallback(
    async (send: boolean) => {
      const transcript = transcriptRef.current.trim();
      transcriptRef.current = "";
      shouldSendRef.current = false;
      recognitionRef.current = null;
      stopTracks();
      setListeningState(false);

      if (send && transcript.length > 0 && !disabled) {
        writePreview("");
        await onSendRef.current(transcript);
        return;
      }

      writePreview(savedTextareaRef.current);
    },
    [disabled, setListeningState, stopTracks, writePreview],
  );

  const stopRecognition = useCallback(
    (send: boolean) => {
      shouldSendRef.current = send;
      const recognition = recognitionRef.current;
      if (!recognition) {
        void finishListening(send);
        return;
      }
      try {
        recognition.stop();
      } catch {
        void finishListening(send);
      }
    },
    [finishListening],
  );

  const startListening = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setSupported(false);
      onErrorRef.current?.("Voice input needs Chrome, Edge, or Safari.");
      return;
    }

    onErrorRef.current?.(undefined);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionDenied(true);
      onErrorRef.current?.("Microphone access was blocked. Allow the mic to use press-to-talk.");
      return;
    }

    const textarea = document.querySelector<HTMLTextAreaElement>(
      'form textarea[name="message"]',
    );
    savedTextareaRef.current = textarea?.value ?? "";
    transcriptRef.current = "";
    shouldSendRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const spoken = transcriptFromResults(event.results);
      transcriptRef.current = spoken;
      writePreview(spoken);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPermissionDenied(true);
      }
      const message = errorMessageForCode(event.error);
      if (message) {
        onErrorRef.current?.(message);
      }
      if (event.error === "aborted") {
        shouldSendRef.current = false;
      }
    };

    recognition.onend = () => {
      const send = shouldSendRef.current;
      void finishListening(send);
    };

    try {
      recognition.start();
      setListeningState(true);
    } catch {
      stopTracks();
      recognitionRef.current = null;
      onErrorRef.current?.("Voice input failed. Try again or type your message.");
    }
  }, [finishListening, setListeningState, stopTracks, writePreview]);

  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      stopRecognition(true);
      return;
    }
    void startListening();
  }, [startListening, stopRecognition]);

  useEffect(() => {
    setSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  useEffect(() => {
    if (disabled && listeningRef.current) {
      stopRecognition(false);
    }
  }, [disabled, stopRecognition]);

  useEffect(
    () => () => {
      shouldSendRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // Recognition may already be stopped.
      }
      stopTracks();
    },
    [stopTracks],
  );

  const unavailable = !supported || permissionDenied;
  const tooltip = !supported
    ? "Voice input needs Chrome, Edge, or Safari"
    : permissionDenied
      ? "Microphone access was blocked"
      : listening
        ? "Stop listening"
        : "Press to talk";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="absolute right-12 bottom-2.5 inline-flex">
          <InputGroupButton
            aria-label={listening ? "Stop listening" : "Press to talk"}
            aria-pressed={listening}
            className={cn(
              "rounded-full",
              listening && "bg-destructive text-white hover:bg-destructive/90",
            )}
            disabled={disabled || unavailable}
            onClick={toggleListening}
            size="icon-sm"
            type="button"
            variant={listening ? "destructive" : "ghost"}
          >
            {permissionDenied ? (
              <MicOffIcon className="size-4" />
            ) : (
              <MicIcon className={cn("size-4", listening && "animate-pulse")} />
            )}
          </InputGroupButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
