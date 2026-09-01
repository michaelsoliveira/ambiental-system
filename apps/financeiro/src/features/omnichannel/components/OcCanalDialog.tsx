'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { whatsappApi, type WhatsappInstance } from '@/lib/api/whatsapp';
import {
  useOcAgentesQuery,
  useOcCanalCreate,
  useOcCanalPatch,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcCanal } from '@/features/omnichannel/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canal?: OcCanal | null;
};

function cfgStr(config: Record<string, unknown>, key: string): string {
  const v = config[key];
  return v != null ? String(v) : '';
}

export function OcCanalDialog({ open, onOpenChange, canal }: Props) {
  const { data: agentes = [] } = useOcAgentesQuery();
  const criar = useOcCanalCreate();
  const patch = useOcCanalPatch();

  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [nome, setNome] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [orquestradorId, setOrquestradorId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [iaHabilitada, setIaHabilitada] = useState(true);

  const orquestradores = agentes.filter((a) => a.ativo && a.tipo === 'orchestrator');
  const workers = agentes.filter((a) => a.ativo && a.tipo === 'worker');

  useEffect(() => {
    if (!open) return;
    whatsappApi.listInstances().then(setInstances).catch(() => setInstances([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (canal) {
      setNome(canal.nome);
      setIaHabilitada(canal.ia_habilitada);
      setInstanceId(cfgStr(canal.config, 'whatsapp_instance_id'));
      setOrquestradorId(cfgStr(canal.config, 'agente_orquestrador_id'));
      setWorkerId(cfgStr(canal.config, 'agente_worker_id'));
    } else {
      setNome('');
      setInstanceId('');
      setOrquestradorId('');
      setWorkerId('');
      setIaHabilitada(true);
    }
  }, [open, canal]);

  const selectedInstance = instances.find((i) => i.id === instanceId);

  const buildConfig = () => {
    const inst = selectedInstance;
    const config: Record<string, unknown> = {
      ...(canal?.config ?? {}),
    };
    if (inst) {
      config.instance_name = inst.name;
      config.whatsapp_instance_id = inst.id;
    }
    if (orquestradorId) config.agente_orquestrador_id = orquestradorId;
    else delete config.agente_orquestrador_id;
    if (workerId) config.agente_worker_id = workerId;
    else delete config.agente_worker_id;
    return config;
  };

  const handleSave = async () => {
    const config = buildConfig();
    if (canal) {
      await patch.mutateAsync({
        id: canal.id,
        nome: nome.trim() || canal.nome,
        ia_habilitada: iaHabilitada,
        config,
      });
    } else {
      const inst = selectedInstance;
      if (!inst) return;
      await criar.mutateAsync({
        nome: nome.trim() || `WhatsApp — ${inst.description || inst.name}`,
        tipo: 'whatsapp_evolution',
        ia_habilitada: iaHabilitada,
        config,
      });
    }
    onOpenChange(false);
  };

  const pending = criar.isPending || patch.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{canal ? 'Editar canal' : 'Conectar canal WhatsApp'}</DialogTitle>
          <DialogDescription>
            Vincule a instância Evolution ao Jarvis: orquestrador roteia para workers via skills e tools.
            O flag &quot;Principal&quot; na linha WhatsApp só define a linha padrão — o agente vem daqui.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do canal</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="WhatsApp — Recepção" />
          </div>

          <div className="space-y-2">
            <Label>Instância WhatsApp</Label>
            <Select value={instanceId || undefined} onValueChange={setInstanceId} disabled={!!canal}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a instância Evolution" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.description || inst.name}
                    {inst.is_main ? ' (Principal)' : ''}
                    {inst.is_notification ? ' (Notificações)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agente orquestrador (Jarvis)</Label>
            <Select value={orquestradorId || undefined} onValueChange={setOrquestradorId}>
              <SelectTrigger>
                <SelectValue placeholder="Quem atende primeiro neste canal" />
              </SelectTrigger>
              <SelectContent>
                {orquestradores.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Roteia conversas e pode transferir para workers com a tool transferirParaAgente.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Worker padrão (opcional)</Label>
            <Select value={workerId || 'none'} onValueChange={(v) => setWorkerId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Especialista padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum — só orquestrador</SelectItem>
                {workers.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">IA habilitada neste canal</p>
              <p className="text-xs text-muted-foreground">Desative para linhas só humanas ou notificações.</p>
            </div>
            <Switch checked={iaHabilitada} onCheckedChange={setIaHabilitada} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={pending || (!canal && !instanceId)}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
