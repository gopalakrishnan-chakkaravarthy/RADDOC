import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (event: any) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [hasSupport, setHasSupport] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const simulationTimerRef = useRef<any>(null);
  const audioAnimationRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setHasSupport(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
      if (audioAnimationRef.current) {
        clearInterval(audioAnimationRef.current);
      }
    };
  }, []);

  // Audio waveform levels animation
  useEffect(() => {
    if (isListening) {
      audioAnimationRef.current = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 150);
    } else {
      setAudioLevel(0);
      if (audioAnimationRef.current) {
        clearInterval(audioAnimationRef.current);
      }
    }
    return () => {
      if (audioAnimationRef.current) clearInterval(audioAnimationRef.current);
    };
  }, [isListening]);

  const startSimulation = useCallback(() => {
    setIsSimulated(true);
    setIsListening(true);
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    const presetDictations = [
      ["Gallbladder", "shows", "a", "6mm", "calculus", "with", "normal", "wall", "thickness."],
      ["Liver", "is", "mildly", "enlarged", "measuring", "15.8cm", "with", "grade 1", "fatty", "infiltration."],
      ["Both", "kidneys", "show", "normal", "size", "and", "corticomedullary", "differentiation."],
      ["Urinary", "bladder", "is", "well", "distended", "with", "no", "intraluminal", "mass", "or", "calculus."]
    ];

    const selectedWords = presetDictations[Math.floor(Math.random() * presetDictations.length)];
    let currentText = '';
    let wordIdx = 0;

    simulationTimerRef.current = setInterval(() => {
      if (wordIdx < selectedWords.length) {
        currentText += (wordIdx > 0 ? ' ' : '') + selectedWords[wordIdx];
        setTranscript(currentText);
        if (onResult) onResult(currentText, wordIdx === selectedWords.length - 1);
        wordIdx++;
      } else {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        setIsListening(false);
      }
    }, 180);
  }, [onResult]);

  const startListening = useCallback(() => {
    if (isListening) return;

    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      startSimulation();
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setIsSimulated(false);
      };

      recognition.onresult = (event: any) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript + ' ';
          } else {
            currentInterim += res[0].transcript;
          }
        }

        const combined = (currentFinal + currentInterim).trim();
        setTranscript(combined);
        setInterimTranscript(currentInterim);

        if (onResult) {
          onResult(combined, currentInterim === '');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (onError) onError(event);
        if (event.error !== 'no-speech') {
          startSimulation();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition, using simulated stream:', err);
      startSimulation();
    }
  }, [continuous, interimResults, isListening, lang, onError, onResult, startSimulation]);

  const stopListening = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    hasSupport,
    isSimulated,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript
  };
}
