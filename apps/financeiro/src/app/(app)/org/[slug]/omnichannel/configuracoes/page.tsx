'use client';
import { useState, useEffect } from 'react';
import { Save, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AGENTE_MODELOS,
  MODELO_GROUPS,
} from '@/features/omnichannel/components/agentes/oc-agente-constants';
import {
  useOcCanaisQuery,
  useOcCanalPatch,
  useOcConfigIAQuery,
  useOcConfigIAPatch,
  useOcTagsQuery,
  useOcTagCreate,
} from '@/features/omnichannel/hooks/use-oc-api';
import { OcCanalCreateDialog } from '@/features/omnichannel/components/canais/oc-canal-create-dialog';
import { OcCanalCard } from '@/features/omnichannel/components/canais/oc-canal-card';
import { OcHorarioAtendimento } from '@/features/omnichannel/components/OcHorarioAtendimento';
import {
  defaultHorarioConfig,
  normalizeHorarioConfig,
  type OcHorarioConfig,
} from '@/features/omnichannel/components/oc-horario-utils';
import type { OcCanal, OcTag } from '@/features/omnichannel/types';
import { cn } from '@/lib/utils';

type IaCanalModo = 'padrao' | 'on' | 'off';

const COLORS = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink', 'zinc'];
const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', amber: 'bg-amber-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500', zinc: 'bg-zinc-400',
};

function CanaisTab() {
  const { data: canais = [], isLoading } = useOcCanaisQuery();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Conecte WhatsApp, formulário da landing e outros canais para receber e
          responder conversas.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Canal
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando canais…</p>
      ) : canais.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <p className="text-sm">Nenhum canal configurado</p>
          <p className="max-w-sm text-center text-xs">
            Crie um canal WhatsApp (Evolution) ou Formulário da landing para
            começar a atender.
          </p>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Conectar Canal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canais.map((c: OcCanal) => (
            <OcCanalCard key={c.id} canal={c} />
          ))}
        </div>
      )}
      <OcCanalCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function IaCanalModoControl({
  modo,
  onChange,
}: {
  modo: IaCanalModo;
  onChange: (m: IaCanalModo) => void;
}) {
  const options: { value: IaCanalModo; label: string; activeClass?: string }[] = [
    { value: 'padrao', label: 'Padrão' },
    { value: 'on', label: 'ON', activeClass: 'bg-emerald-600 text-white hover:bg-emerald-600' },
    { value: 'off', label: 'OFF' },
  ];

  return (
    <div className="flex rounded-md border p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition-colors',
            modo === opt.value
              ? opt.activeClass ?? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function IATab() {
  const { data: cfg } = useOcConfigIAQuery();
  const { data: canais = [] } = useOcCanaisQuery();
  const patch = useOcConfigIAPatch();
  const patchCanal = useOcCanalPatch();
  const [form, setForm] = useState({
    ia_habilitada: true,
    pausar_ia_humano_responde: true,
    atendimento_24h: true,
    timezone: 'America/Sao_Paulo',
    horario_config: defaultHorarioConfig(),
    contexto_negocio: '',
    mensagem_fora_horario: '',
    dominios_permitidos: '',
    handoff_keywords: '',
    resumo_modelo: 'gpt-4o-mini',
  });

  useEffect(() => {
    if (cfg) {
      setForm({
        ia_habilitada: cfg.ia_habilitada,
        pausar_ia_humano_responde: cfg.pausar_ia_humano_responde,
        atendimento_24h: cfg.atendimento_24h,
        timezone: cfg.timezone ?? 'America/Sao_Paulo',
        horario_config: normalizeHorarioConfig(cfg.horario_config),
        contexto_negocio: cfg.contexto_negocio ?? '',
        mensagem_fora_horario: cfg.mensagem_fora_horario ?? '',
        dominios_permitidos: (cfg.dominios_permitidos ?? []).join('\n'),
        handoff_keywords: (cfg.handoff_keywords ?? []).join('\n'),
        resumo_modelo: cfg.resumo_modelo || 'gpt-4o-mini',
      });
    }
  }, [cfg]);

  const handleSave = () => {
    patch.mutate({
      ia_habilitada: form.ia_habilitada,
      pausar_ia_humano_responde: form.pausar_ia_humano_responde,
      atendimento_24h: form.atendimento_24h,
      timezone: form.timezone,
      horario_config: form.horario_config,
      contexto_negocio: form.contexto_negocio || undefined,
      mensagem_fora_horario: form.mensagem_fora_horario || undefined,
      dominios_permitidos: form.dominios_permitidos.split('\n').map((s) => s.trim()).filter(Boolean),
      handoff_keywords: form.handoff_keywords.split('\n').map((s) => s.trim()).filter(Boolean),
      resumo_modelo: form.resumo_modelo,
    });
  };

  const getCanalModo = (canal: OcCanal): IaCanalModo => {
    const modo = canal.config?.ia_modo as IaCanalModo | undefined;
    if (modo === 'on' || modo === 'off') return modo;
    return 'padrao';
  };

  const setCanalModo = (canal: OcCanal, modo: IaCanalModo) => {
    const config = { ...(canal.config ?? {}) };
    if (modo === 'padrao') {
      delete config.ia_modo;
    } else {
      config.ia_modo = modo;
    }
    patchCanal.mutate({
      id: canal.id,
      config,
      ia_habilitada: modo === 'on' ? true : modo === 'off' ? false : canal.ia_habilitada,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">Inteligência Artificial</h2>
            <p className="text-sm text-muted-foreground">Configure quando e como os agentes de IA atendem</p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={patch.isPending}>
          <Save className="mr-2 h-3.5 w-3.5" /> Salvar alterações
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">IA habilitada (geral)</p>
          <p className="text-xs text-muted-foreground">
            Padrão pra novas conversas. Canais individuais podem sobrepor esse toggle (abaixo).
            Conversas individuais também podem forçar IA ON/OFF.
          </p>
        </div>
        <Switch
          checked={form.ia_habilitada}
          onCheckedChange={(v) => setForm({ ...form, ia_habilitada: v })}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">IA por canal</p>
          <p className="text-xs text-muted-foreground">
            Sobrepõe o toggle geral acima por canal. Útil pra ligar IA só num número de teste,
            ou desligar num canal de produção temporariamente.
          </p>
        </div>
        {canais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum canal configurado — veja a aba Canais.</p>
        ) : (
          canais.map((c: OcCanal) => {
            const sub = String(c.config?.instance_name ?? c.tipo.replace(/_/g, ' '));
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <IaCanalModoControl modo={getCanalModo(c)} onChange={(m) => setCanalModo(c, m)} />
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Pausar IA quando humano responde</p>
          <p className="text-xs text-muted-foreground">
            Assim que um atendente envia uma mensagem na conversa, a IA é automaticamente desativada
            nessa conversa específica.
          </p>
        </div>
        <Switch
          checked={form.pausar_ia_humano_responde}
          onCheckedChange={(v) => setForm({ ...form, pausar_ia_humano_responde: v })}
        />
      </div>

      <OcHorarioAtendimento
        atendimento24h={form.atendimento_24h}
        onAtendimento24hChange={(v) => setForm({ ...form, atendimento_24h: v })}
        timezone={form.timezone}
        onTimezoneChange={(tz) => setForm({ ...form, timezone: tz })}
        value={form.horario_config}
        onChange={(horario_config: OcHorarioConfig) => setForm({ ...form, horario_config })}
      />

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Mensagem fora de horário (opcional)</Label>
        <Textarea
          rows={3}
          value={form.mensagem_fora_horario}
          onChange={(e) => setForm({ ...form, mensagem_fora_horario: e.target.value })}
          placeholder="Olá! No momento estamos fora do horário de atendimento..."
        />
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Palavras-chave de handoff (uma por linha)</Label>
        <Textarea
          rows={4}
          value={form.handoff_keywords}
          onChange={(e) => setForm({ ...form, handoff_keywords: e.target.value })}
          placeholder={'atendente\nhumano\nfalar com alguém'}
        />
        <p className="text-xs text-muted-foreground">
          Quando o contato usar uma dessas palavras, a conversa vai para fila humana (status pendente).
        </p>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Modelo do resumo de handoff</Label>
        <Select
          value={form.resumo_modelo}
          onValueChange={(v) => setForm({ ...form, resumo_modelo: v })}
        >
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent>
            {MODELO_GROUPS.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {AGENTE_MODELOS.filter((m) => m.group === group).map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Modelo usado para gerar a nota interna de resumo ao transferir a conversa para um atendente
          humano. Padrão: GPT-4o Mini — modelos locais podem ser usados para reduzir custo.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Contexto do negócio (visto por todos os agentes)</Label>
        <Textarea
          rows={6}
          value={form.contexto_negocio}
          onChange={(e) => setForm({ ...form, contexto_negocio: e.target.value })}
          placeholder="Informe horários, políticas de reembolso, talking points..."
        />
        <p className="text-xs text-muted-foreground">{form.contexto_negocio.length} / 4000</p>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Domínios permitidos em links da IA</Label>
        <Textarea
          rows={4}
          className="font-mono text-xs"
          value={form.dominios_permitidos}
          onChange={(e) => setForm({ ...form, dominios_permitidos: e.target.value })}
          placeholder={'inexahub.com.br\ninexahub.co'}
        />
        <p className="text-xs text-muted-foreground">Um domínio por linha.</p>
      </div>
    </div>
  );
}

function TagsTab() {
  const { data: tags = [] } = useOcTagsQuery();
  const criar = useOcTagCreate();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('blue');

  const handleCriar = () => {
    if (!nome.trim()) return;
    criar.mutate({ nome: nome.trim(), cor }, { onSuccess: () => setNome('') });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Organize conversas e contatos com tags coloridas</p>
      <div className="flex items-center gap-3">
        <Input placeholder="Ex: VIP, Urgente, Lead..." value={nome} onChange={(e) => setNome(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setCor(c)}
              className={cn('h-6 w-6 rounded-full transition-transform', COLOR_CLASSES[c], cor === c && 'ring-2 ring-offset-1 ring-primary scale-110')} />
          ))}
        </div>
        <Button size="sm" onClick={handleCriar} disabled={!nome.trim() || criar.isPending}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Criar
        </Button>
      </div>
      <div className="space-y-1">
        {tags.map((t: OcTag) => (
          <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', COLOR_CLASSES[t.cor] ?? 'bg-blue-500')} />
              <span className="text-sm">{t.nome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Configurações</h1>
      <p className="mb-6 text-sm text-muted-foreground">Gerencie sua organização e integrações</p>
      <Tabs defaultValue="canais">
        <TabsList>
          <TabsTrigger value="canais">Canais</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="canais"><CanaisTab /></TabsContent>
          <TabsContent value="ia"><IATab /></TabsContent>
          <TabsContent value="tags"><TagsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
