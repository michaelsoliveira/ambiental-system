'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, MoreVertical, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const SPEEDS = ['0.5', '1', '1.5', '2'] as const;

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function OcAudioPlayer({
  src,
  downloadName,
  className,
}: {
  src: string;
  downloadName?: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState('1');

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
    };
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = Number(speed);
  }, [speed]);

  const label = downloadName?.trim() || 'audio';

  return (
    <div
      className={cn(
        'flex min-w-[220px] max-w-sm items-center gap-2 py-0.5',
        className,
      )}
    >
      <audio ref={audioRef} preload="metadata" src={src} className="hidden" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/25 dark:text-emerald-300"
        onClick={togglePlay}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </Button>

      <div className="min-w-0 flex-1 space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={current}
          onChange={(e) => {
            const el = audioRef.current;
            if (!el) return;
            const t = Number(e.target.value);
            el.currentTime = t;
            setCurrent(t);
          }}
          className="h-1 w-full cursor-pointer accent-emerald-600"
          aria-label="Progresso do áudio"
        />
        <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
          <span>{formatAudioTime(current)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Opções do áudio"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Velocidade</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={speed} onValueChange={setSpeed}>
            {SPEEDS.map((s) => (
              <DropdownMenuRadioItem key={s} value={s}>
                {s}x
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={src} download={label} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Baixar áudio
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
