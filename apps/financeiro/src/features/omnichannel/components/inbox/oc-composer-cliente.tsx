'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  attachAudioLevelMeter,
  openMicrophoneStream,
  startRecorder,
  stopRecorderAndCollectBlob,
} from '@/lib/audio-recording';
import { OcComposerAttachMenu } from './oc-composer-attach-menu';

const MIN_AUDIO_BYTES = 800;
const MIN_RECORDING_SEC = 1;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = {
  texto: string;
  onTextoChange: (value: string) => void;
  disabled?: boolean;
  onSendText: () => void;
  onSendFile: (file: File, legenda?: string) => void;
  /** Canal landing: escolher e-mail ou WhatsApp */
  replyDestino?: 'email' | 'whatsapp';
  onReplyDestinoChange?: (destino: 'email' | 'whatsapp') => void;
  replyDestinoOptions?: Array<{
    value: 'email' | 'whatsapp';
    label: string;
    disabled?: boolean;
    title?: string;
  }>;
};

export function OcComposerCliente({
  texto,
  onTextoChange,
  disabled,
  onSendText,
  onSendFile,
  replyDestino,
  onReplyDestinoChange,
  replyDestinoOptions,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [micLevel, setMicLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const filenameRef = useRef('audio.webm');
  const stopMeterRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const showDestino =
    Boolean(replyDestinoOptions?.length) && Boolean(onReplyDestinoChange);

  const releaseStream = useCallback(() => {
    stopMeterRef.current?.();
    stopMeterRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setMicLevel(0);
    setDurationSec(0);
  }, []);

  const cancelRecording = useCallback(() => {
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null;
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    chunksRef.current = [];
    releaseStream();
    setRecording(false);
  }, [releaseStream]);

  useEffect(() => () => cancelRecording(), [cancelRecording]);

  const startRecording = async () => {
    if (disabled || recording || uploading) return;
    try {
      const stream = await openMicrophoneStream();
      streamRef.current = stream;
      chunksRef.current = [];

      const { recorder, filename } = startRecorder(stream);
      filenameRef.current = filename;
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);

      stopMeterRef.current = await attachAudioLevelMeter(stream, setMicLevel);

      timerRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (err) {
      releaseStream();
      toast.error(err instanceof Error ? err.message : 'Não foi possível acessar o microfone');
    }
  };

  const finishRecording = async () => {
    const mr = recorderRef.current;
    if (!mr || !recording) return;

    const elapsed = (Date.now() - startedAtRef.current) / 1000;
    if (elapsed < MIN_RECORDING_SEC) {
      toast.error('Grave pelo menos 1 segundo de áudio');
      return;
    }

    setUploading(true);
    try {
      const blob = await stopRecorderAndCollectBlob(mr, chunksRef.current);
      if (blob.size < MIN_AUDIO_BYTES) {
        throw new Error('Áudio muito curto ou sem sinal. Tente falar mais perto do microfone.');
      }
      const file = new File([blob], filenameRef.current, { type: blob.type || 'audio/webm' });
      onSendFile(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao gravar áudio');
    } finally {
      chunksRef.current = [];
      releaseStream();
      setRecording(false);
      setUploading(false);
    }
  };

  if (recording) {
    return (
      <div className="flex w-full items-end gap-2">
        <div className="h-10 w-10 shrink-0" />
        <div className="flex min-h-[42px] flex-1 items-center gap-2 rounded-xl bg-background px-3 py-2 shadow-sm">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${Math.max(8, micLevel)}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatDuration(durationSec)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={cancelRecording}
            disabled={uploading}
            title="Cancelar gravação"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={finishRecording}
            disabled={uploading}
            title="Enviar áudio"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {showDestino ? (
        <div className="flex max-w-full min-w-0 flex-wrap gap-0.5 rounded-lg bg-muted/60 p-0.5">
          {replyDestinoOptions!.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled || opt.disabled}
              onClick={() => onReplyDestinoChange?.(opt.value)}
              className={cn(
                'max-w-full truncate rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40',
                replyDestino === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title={opt.title || opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex w-full min-w-0 items-end gap-2">
        <OcComposerAttachMenu
          disabled={disabled}
          onFileSelect={(file) => {
            onSendFile(file, texto.trim() || undefined);
            onTextoChange('');
          }}
        />
        <Textarea
          value={texto}
          onChange={(e) => onTextoChange(e.target.value)}
          placeholder="Digite uma mensagem"
          className="min-h-[42px] max-h-32 min-w-0 flex-1 resize-none rounded-xl border-0 bg-background px-4 py-2.5 text-sm shadow-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendText();
            }
          }}
        />
        {texto.trim() ? (
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={onSendText}
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full hover:bg-background"
            onClick={startRecording}
            disabled={disabled || uploading}
            title="Gravar áudio"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
