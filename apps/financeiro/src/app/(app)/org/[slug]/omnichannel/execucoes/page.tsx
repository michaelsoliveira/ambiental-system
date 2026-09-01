'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useOcExecucoesQuery } from '@/features/omnichannel/hooks/use-oc-api';
import type { StatusRun } from '@/features/omnichannel/types';
import { cn } from '@/lib/utils';

const STATUS_ICON: Record<StatusRun, React.ElementType> = {
  running: Loader2, success: CheckCircle2, error: XCircle, timeout: Clock,
};
const STATUS_COLOR: Record<StatusRun, string> = {
  running: 'text-blue-500', success: 'text-green-600', error: 'text-destructive', timeout: 'text-amber-500',
};

export default function ExecucoesPage() {
  const [dias, setDias] = useState('7');
  const [soErros, setSoErros] = useState(false);
  const { data: runs = [], isLoading } = useOcExecucoesQuery({ dias: Number(dias), so_erros: soErros });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Execuções</h1>
          <p className="text-sm text-muted-foreground">Histórico de runs e skills chamadas — atualiza a cada 10s</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={dias} onValueChange={setDias}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['1', '3', '7', '14', '30'].map((d) => <SelectItem key={d} value={d}>{d} dias</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={soErros} onCheckedChange={setSoErros} />
          <Label className="text-xs">Só com erros</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : runs.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 opacity-20" />
            Nenhuma execução com esse filtro
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run: any) => {
            const status = run.status as StatusRun;
            const Icon = STATUS_ICON[status];
            return (
              <div key={run.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', STATUS_COLOR[status], status === 'running' && 'animate-spin')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{status.toUpperCase()}</Badge>
                    {run.agente_id && <span className="text-xs text-muted-foreground">agente: {run.agente_id.slice(0, 8)}...</span>}
                    {run.skill_id && <span className="text-xs text-muted-foreground">skill: {run.skill_id.slice(0, 8)}...</span>}
                    {run.duration_ms && <span className="text-xs text-muted-foreground">{run.duration_ms}ms</span>}
                    {run.tokens_input && <span className="text-xs text-muted-foreground">{(run.tokens_input + (run.tokens_output ?? 0)).toLocaleString()} tokens</span>}
                  </div>
                  {run.error_msg && <p className="mt-1 text-xs text-destructive font-mono truncate">{run.error_msg}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(run.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
