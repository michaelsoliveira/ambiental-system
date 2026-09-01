'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Archive, Mail, Search, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useOcTagsQuery } from '@/features/omnichannel/hooks/use-oc-api';
import { useOcStore } from '@/stores/use-oc-store';

const TAG_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  purple: '#a855f7',
};

function tagColor(cor: string) {
  return TAG_COLORS[cor] ?? '#94a3b8';
}

type FilterRowProps = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  icon: ReactNode;
  title: string;
  description: string;
};

function FilterRow({ checked, onCheckedChange, icon, title, description }: FilterRowProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-2 hover:bg-muted/50">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

export function OcInboxFiltersMenu() {
  const {
    filtroNaoLidas,
    filtroArquivadas,
    filtroGrupos,
    tagsFiltro,
    setFiltros,
  } = useOcStore();
  const { data: tagsData } = useOcTagsQuery();
  const tags = tagsData ?? [];
  const [tagBusca, setTagBusca] = useState('');

  const hasActiveFilters =
    filtroNaoLidas ||
    filtroArquivadas ||
    filtroGrupos ||
    tagsFiltro.length > 0;

  const tagsFiltradas = useMemo(() => {
    const q = tagBusca.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.nome.toLowerCase().includes(q));
  }, [tags, tagBusca]);

  const toggleTag = (nome: string) => {
    const next = tagsFiltro.includes(nome)
      ? tagsFiltro.filter((t) => t !== nome)
      : [...tagsFiltro, nome];
    setFiltros({ tagsFiltro: next });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0',
            hasActiveFilters && 'border-primary text-primary',
          )}
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Filtros
          </p>
          <FilterRow
            checked={filtroNaoLidas}
            onCheckedChange={(v) => setFiltros({ filtroNaoLidas: v })}
            icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />}
            title="Não lidas"
            description="Apenas com mensagens novas"
          />
          <FilterRow
            checked={filtroArquivadas}
            onCheckedChange={(v) => setFiltros({ filtroArquivadas: v })}
            icon={<Archive className="h-3.5 w-3.5 text-muted-foreground" />}
            title="Arquivadas"
            description="Mostra a inbox arquivada"
          />
          <FilterRow
            checked={filtroGrupos}
            onCheckedChange={(v) => setFiltros({ filtroGrupos: v })}
            icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />}
            title="Grupos"
            description="Inclui conversas de grupos. Desmarcado = esconde."
          />
        </div>

        <div className="border-t p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tagBusca}
              onChange={(e) => setTagBusca(e.target.value)}
              placeholder="Buscar tag..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="max-h-40 space-y-0.5 overflow-y-auto">
            {tagsFiltradas.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Nenhuma tag encontrada.</p>
            ) : (
              tagsFiltradas.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={tagsFiltro.includes(t.nome)}
                    onCheckedChange={() => toggleTag(t.nome)}
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tagColor(t.cor) }}
                  />
                  <span className="text-sm">{t.nome}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
