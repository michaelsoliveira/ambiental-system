'use client';

import { Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DIAS_SEMANA,
  TIMEZONES,
  type OcHorarioConfig,
  type OcHorarioDia,
  getDiaConfig,
  updateDiaConfig,
} from './oc-horario-utils';

type Props = {
  atendimento24h: boolean;
  onAtendimento24hChange: (v: boolean) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  value: OcHorarioConfig;
  onChange: (v: OcHorarioConfig) => void;
};

function DiaRow({
  dia,
  config,
  onChange,
}: {
  dia: OcHorarioDia;
  config: OcHorarioConfig;
  onChange: (v: OcHorarioConfig) => void;
}) {
  const label = DIAS_SEMANA.find((d) => d.dia === dia.dia)?.label ?? '';

  const toggleAtivo = (ativo: boolean) => {
    onChange(
      updateDiaConfig(config, dia.dia, {
        ativo,
        janelas: ativo && dia.janelas.length === 0 ? [{ inicio: '09:00', fim: '18:00' }] : dia.janelas,
      }),
    );
  };

  const updateJanela = (idx: number, field: 'inicio' | 'fim', val: string) => {
    const janelas = dia.janelas.map((j, i) => (i === idx ? { ...j, [field]: val } : j));
    onChange(updateDiaConfig(config, dia.dia, { janelas }));
  };

  const removeJanela = (idx: number) => {
    const janelas = dia.janelas.filter((_, i) => i !== idx);
    onChange(updateDiaConfig(config, dia.dia, { janelas }));
  };

  const addJanela = () => {
    onChange(
      updateDiaConfig(config, dia.dia, {
        janelas: [...dia.janelas, { inicio: '09:00', fim: '18:00' }],
      }),
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0">
      <div className="flex w-28 shrink-0 items-center gap-2">
        <Checkbox checked={dia.ativo} onCheckedChange={(v) => toggleAtivo(!!v)} id={`dia-${dia.dia}`} />
        <Label htmlFor={`dia-${dia.dia}`} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
      </div>

      {!dia.ativo ? (
        <span className="text-sm text-muted-foreground">Não atende</span>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {dia.janelas.map((janela, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={janela.inicio}
                  onChange={(e) => updateJanela(idx, 'inicio', e.target.value)}
                  className="w-[7.5rem] pl-8"
                />
              </div>
              <span className="text-sm text-muted-foreground">até</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={janela.fim}
                  onChange={(e) => updateJanela(idx, 'fim', e.target.value)}
                  className="w-[7.5rem] pl-8"
                />
              </div>
              {dia.janelas.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeJanela(idx)}
                  aria-label="Remover janela"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {idx === dia.janelas.length - 1 && (
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addJanela}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Janela
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OcHorarioAtendimento({
  atendimento24h,
  onAtendimento24hChange,
  timezone,
  onTimezoneChange,
  value,
  onChange,
}: Props) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="mb-4">
          <p className="text-sm font-medium">Horário de atendimento</p>
          <p className="text-xs text-muted-foreground">Fora desses horários a IA não responde.</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch checked={atendimento24h} onCheckedChange={onAtendimento24hChange} id="atendimento-24h" />
            <Label htmlFor="atendimento-24h" className="cursor-pointer text-sm">
              Atendimento 24/7
            </Label>
          </div>
          {!atendimento24h && (
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!atendimento24h && (
        <div className="rounded-md border bg-muted/20 px-3">
          {DIAS_SEMANA.map(({ dia }) => (
            <DiaRow
              key={dia}
              dia={getDiaConfig(value, dia)}
              config={value}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
