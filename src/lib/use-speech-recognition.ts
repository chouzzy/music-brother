"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}

interface SpeechRecognitionClass {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionClass;
    webkitSpeechRecognition?: SpeechRecognitionClass;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-speech": "Não detectei voz. Fala mais perto do mic.",
  "audio-capture": "Microfone não disponível.",
  "not-allowed": "Permissão de microfone negada. Libera nas configurações do navegador.",
  "service-not-allowed": "Serviço de voz bloqueado pelo navegador.",
  network: "Erro de rede ao reconhecer voz.",
  aborted: "",
};

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const noopSubscribe = () => () => {};
const getSupported = () =>
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
const getServerSupported = () => false;

export function useSpeechRecognition(
  lang = "pt-BR",
): UseSpeechRecognitionResult {
  const supported = useSyncExternalStore(
    noopSubscribe,
    getSupported,
    getServerSupported,
  );
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterimText("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setError("Reconhecimento de voz não é suportado nesse browser.");
      return;
    }

    setError(null);
    setFinalText("");
    setInterimText("");

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      let appendedFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          appendedFinal += transcript;
        } else {
          interim += transcript;
        }
      }
      if (appendedFinal) {
        setFinalText((prev) => (prev + " " + appendedFinal).replace(/\s+/g, " ").trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      const msg = ERROR_MESSAGES[event.error];
      if (msg !== "") {
        setError(msg ?? `Erro: ${event.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Não consegui iniciar o microfone.");
      setListening(false);
    }
  }, [lang]);

  const transcript = (finalText + " " + interimText).replace(/\s+/g, " ").trim();

  return { supported, listening, transcript, error, start, stop, reset };
}
