'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, Lightbulb, Terminal, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getPublicApiUrl } from '@/lib/api-url';
import {
  useOcAgenteSkillLink,
  useOcAgenteSkillUnlink,
  useOcAgenteSkillsQuery,
  useOcSkillsQuery,
} from '@/features/omnichannel/hooks/use-oc-api';

type Props = {
  agenteId: string;
};

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copiado!'),
    () => toast.error('Não foi possível copiar'),
  );
}

function ApiSnippet({ label, code }: { label: string; code: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2">
        <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed">
          {code}
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => copyText(code)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function OcAgenteSkillsSection({ agenteId }: Props) {
  const { slug } = useOcBasePath();

  const [apiOpen, setApiOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: allSkillsData, isLoading: loadingAll } = useOcSkillsQuery();
  const { data: linkedSkillsData, isLoading: loadingLinked } = useOcAgenteSkillsQuery(agenteId);
  const link = useOcAgenteSkillLink();
  const unlink = useOcAgenteSkillUnlink();

  const linkedSkillIdsKey = useMemo(
    () => (linkedSkillsData ?? []).map((s: any) => s.id).sort().join(','),
    [linkedSkillsData],
  );

  const linkedIds = useMemo(
    () => new Set(linkedSkillIdsKey ? linkedSkillIdsKey.split(',') : []),
    [linkedSkillIdsKey],
  );

  const activeSkills = useMemo(
    () => (allSkillsData ?? []).filter((s: any) => s.ativo),
    [allSkillsData],
  );

  useEffect(() => {
    if (linkedSkillsData === undefined) return;
    const ids = linkedSkillsData.map((s: any) => s.id);
    setDraftIds((prev) => {
      if (prev.size === ids.length && ids.every((id: string) => prev.has(id))) return prev;
      return new Set(ids);
    });
    setDirty(false);
  }, [linkedSkillIdsKey, linkedSkillsData]);

  const apiBase = `${getPublicApiUrl()}/organizations/${slug}/omnichannel`;
  const exampleSkillId = activeSkills[0]?.id ?? '<skill_id>';

  const apiExamples = {
    listar: `curl -X GET "${apiBase}/agentes/${agenteId}/skills" \\
  -H "Authorization: Bearer <seu_token>"`,
    vincular: `curl -X POST "${apiBase}/agentes/${agenteId}/skills/${exampleSkillId}" \\
  -H "Authorization: Bearer <seu_token>"`,
    desvincular: `curl -X DELETE "${apiBase}/agentes/${agenteId}/skills/${exampleSkillId}" \\
  -H "Authorization: Bearer <seu_token>"`,
  };

  const toggleDraft = (skillId: string, checked: boolean) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(skillId);
      else next.delete(skillId);
      return next;
    });
    setDirty(true);
  };

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      const toLink = [...draftIds].filter((id) => !linkedIds.has(id));
      const toUnlink = [...linkedIds].filter((id: any) => !draftIds.has(id));
      await Promise.all([
        ...toLink.map((skillId) => link.mutateAsync({ agenteId, skillId })),
        ...toUnlink.map((skillId) => unlink.mutateAsync({ agenteId, skillId })),
      ]);
      setDirty(false);
      if (toLink.length || toUnlink.length) {
        toast.success('Skills salvas');
      }
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingAll || loadingLinked;
  const draftCount = draftIds.size;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Skills atribuídas ({draftCount})</p>
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={!dirty || saving || isLoading}
          onClick={handleSaveSkills}
        >
          {saving ? 'Salvando…' : 'Salvar skills'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Skills são funções invocáveis pelo LLM, ligadas a tools/providers. As built-in (reply,
        transfer, tag) são automáticas.
      </p>

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        Skills marcadas com relógio exigem aprovação humana antes de executar (em breve).
      </p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando skills…</p>
      ) : activeSkills.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma skill cadastrada. Crie em{' '}
          <Link href={`/org/${slug}/omnichannel/skills`} className="text-primary underline-offset-2 hover:underline">
            Jarvis → Skills
          </Link>
          .
        </p>
      ) : (
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {activeSkills.map((skill: any) => {
            const checked = draftIds.has(skill.id);
            return (
              <label
                key={skill.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors',
                  checked ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/40',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggleDraft(skill.id, v === true)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="font-mono text-xs font-medium">{skill.nome}</span>
                    {skill.categoria && (
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        {skill.categoria}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {skill.descricao_llm}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <Collapsible open={apiOpen} onOpenChange={setApiOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-between px-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              API manual (curl)
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', apiOpen && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ApiSnippet label="Listar skills do agente" code={apiExamples.listar} />
          <ApiSnippet label="Vincular skill" code={apiExamples.vincular} />
          <ApiSnippet label="Desvincular skill" code={apiExamples.desvincular} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
