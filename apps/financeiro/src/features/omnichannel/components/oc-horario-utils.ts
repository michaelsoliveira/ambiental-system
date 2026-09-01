export type OcHorarioJanela = {
  inicio: string;
  fim: string;
};

export type OcHorarioDia = {
  /** 0=domingo … 6=sábado */
  dia: number;
  ativo: boolean;
  janelas: OcHorarioJanela[];
};

export type OcHorarioConfig = {
  dias: OcHorarioDia[];
};

export const DIAS_SEMANA: { dia: number; label: string }[] = [
  { dia: 1, label: 'Segunda' },
  { dia: 2, label: 'Terça' },
  { dia: 3, label: 'Quarta' },
  { dia: 4, label: 'Quinta' },
  { dia: 5, label: 'Sexta' },
  { dia: 6, label: 'Sábado' },
  { dia: 0, label: 'Domingo' },
];

export const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Fortaleza',
  'America/Bahia',
  'America/Belem',
  'America/Cuiaba',
  'UTC',
] as const;

const JANELA_PADRAO: OcHorarioJanela = { inicio: '09:00', fim: '18:00' };

export function defaultHorarioConfig(): OcHorarioConfig {
  return {
    dias: DIAS_SEMANA.map(({ dia }) => ({
      dia,
      ativo: dia >= 1 && dia <= 5,
      janelas: dia >= 1 && dia <= 5 ? [{ ...JANELA_PADRAO }] : [],
    })),
  };
}

export function normalizeHorarioConfig(raw?: OcHorarioConfig | Record<string, unknown> | null): OcHorarioConfig {
  const base = defaultHorarioConfig();
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as OcHorarioConfig).dias)) {
    return base;
  }

  const incoming = (raw as OcHorarioConfig).dias;
  const byDia = new Map(incoming.map((d) => [d.dia, d]));

  return {
    dias: base.dias.map((fallback) => {
      const found = byDia.get(fallback.dia);
      if (!found) return fallback;
      const janelas =
        found.ativo && found.janelas?.length
          ? found.janelas.map((j) => ({
              inicio: j.inicio || '09:00',
              fim: j.fim || '18:00',
            }))
          : [];
      return {
        dia: fallback.dia,
        ativo: !!found.ativo,
        janelas: found.ativo && janelas.length === 0 ? [{ ...JANELA_PADRAO }] : janelas,
      };
    }),
  };
}

export function getDiaConfig(config: OcHorarioConfig, dia: number): OcHorarioDia {
  return config.dias.find((d) => d.dia === dia) ?? { dia, ativo: false, janelas: [] };
}

export function updateDiaConfig(
  config: OcHorarioConfig,
  dia: number,
  patch: Partial<OcHorarioDia>,
): OcHorarioConfig {
  return {
    dias: config.dias.map((d) => (d.dia === dia ? { ...d, ...patch } : d)),
  };
}
