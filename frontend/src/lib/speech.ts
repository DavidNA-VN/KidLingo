type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

export function speakEnglish(text: string) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function startEnglishRecognition(
  onTranscript: (value: string) => void,
  onDone: () => void,
  onError: () => void,
) {
  const SpeechRecognitionImpl =
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ??
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .webkitSpeechRecognition;

  if (!SpeechRecognitionImpl) {
    onError();
    return null;
  }

  const recognition = new SpeechRecognitionImpl();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? "";
    onTranscript(transcript);
  };
  recognition.onerror = () => onError();
  recognition.onend = () => onDone();
  recognition.start();
  return recognition;
}

export function isPronunciationPassed(transcript: string, expected: string) {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z ]/g, "");
  const spoken = normalize(transcript);
  const target = normalize(expected);
  return Boolean(target && spoken.includes(target));
}
