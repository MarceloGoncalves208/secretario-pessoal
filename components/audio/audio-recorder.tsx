'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/lib/hooks/use-speech-recognition';

export type AudioRecorderState = 'idle' | 'recording' | 'processing';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function AudioRecorder({
  onTranscriptionComplete,
  onCancel,
  isProcessing = false,
  className,
}: AudioRecorderProps) {
  const {
    isSupported,
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSpeechRecognition();

  const [state, setState] = useState<AudioRecorderState>('idle');

  // Update state based on recording and processing
  useEffect(() => {
    if (isProcessing) {
      setState('processing');
    } else if (isRecording) {
      setState('recording');
    } else {
      setState('idle');
    }
  }, [isRecording, isProcessing]);

  const handleClick = () => {
    if (state === 'processing') return;

    if (state === 'recording') {
      stopRecording();
      // Wait a bit for final transcript
      setTimeout(() => {
        const finalText = transcript.trim();
        if (finalText) {
          onTranscriptionComplete(finalText);
        }
      }, 100);
    } else {
      resetTranscript();
      startRecording();
    }
  };

  const handleCancel = () => {
    stopRecording();
    resetTranscript();
    onCancel?.();
  };

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        title="Reconhecimento de voz não suportado neste navegador"
        className={className}
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  const displayText = interimTranscript || transcript;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={state === 'recording' ? 'destructive' : 'outline'}
        size="icon"
        onClick={handleClick}
        disabled={state === 'processing'}
        title={
          state === 'recording'
            ? 'Clique para parar'
            : state === 'processing'
            ? 'Processando...'
            : 'Clique para gravar'
        }
        className={cn(
          'relative transition-all',
          state === 'recording' && 'animate-pulse'
        )}
      >
        {state === 'processing' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === 'recording' ? (
          <>
            <Mic className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Transcript feedback */}
      {(state === 'recording' || displayText) && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0 p-2 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground truncate">
              {displayText || 'Fale agora...'}
            </p>
          </div>
          {state === 'recording' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
