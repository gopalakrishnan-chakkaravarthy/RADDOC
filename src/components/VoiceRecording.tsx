import React, { useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceRecordingProps {
  currentText: string;
  onTranscriptChange: (newText: string) => void;
  onSendSubmit?: () => void;
  className?: string;
}

export const VoiceRecording: React.FC<VoiceRecordingProps> = ({
  currentText,
  onTranscriptChange,
  onSendSubmit,
  className = ''
}) => {
  const baseTextRef = useRef<string>('');

  const {
    isListening,
    isSimulated,
    audioLevel,
    startListening,
    stopListening
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (latestTranscript, isFinal) => {
      const base = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
      onTranscriptChange((base + latestTranscript).trim());
    }
  });

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
      if (onSendSubmit) {
        setTimeout(() => {
          onSendSubmit();
        }, 200);
      }
    } else {
      baseTextRef.current = currentText;
      startListening();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Visual Audio Waveform & Status Banner */}
      {isListening && (
        <div className="bg-red-950/80 border border-red-900/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-red-200 shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <div>
              <div className="font-bold uppercase tracking-wider text-[10px] text-red-300 flex items-center gap-1.5">
                <span>Listening Live Dictation</span>
                {isSimulated && (
                  <span className="text-[9px] bg-red-900/60 text-red-300 px-1.5 py-0.2 rounded border border-red-700/50 normal-case">
                    Simulated
                  </span>
                )}
              </div>
              <div className="text-[9px] text-red-400 font-mono truncate max-w-[200px]">
                Speak findings into mic...
              </div>
            </div>
          </div>

          {/* Dynamic Audio Visualizer Bars */}
          <div className="flex items-end gap-1 h-5 px-1 bg-slate-950/50 rounded-lg border border-red-900/40 py-1">
            <span
              className="w-1 bg-red-400 rounded-full transition-all duration-100"
              style={{ height: `${Math.max(20, audioLevel * 0.6)}%` }}
            />
            <span
              className="w-1 bg-red-500 rounded-full transition-all duration-100"
              style={{ height: `${Math.max(30, audioLevel)}%` }}
            />
            <span
              className="w-1 bg-red-400 rounded-full transition-all duration-100"
              style={{ height: `${Math.max(15, audioLevel * 0.8)}%` }}
            />
            <span
              className="w-1 bg-red-300 rounded-full transition-all duration-100"
              style={{ height: `${Math.max(25, audioLevel * 0.4)}%` }}
            />
          </div>
        </div>
      )}

      {/* Voice Trigger Button Component */}
      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
          isListening
            ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-lg shadow-red-600/40 font-bold text-xs ring-2 ring-red-400/50'
            : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700 hover:text-cyan-300 shadow-sm'
        }`}
        title={isListening ? "Stop Voice Dictation" : "Start Voice Dictation (useSpeechRecognition Hook)"}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4 text-white animate-bounce" />
            <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">Stop Mic</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] uppercase font-semibold text-cyan-300 hidden sm:inline">Dictate</span>
          </>
        )}
      </button>
    </div>
  );
};
