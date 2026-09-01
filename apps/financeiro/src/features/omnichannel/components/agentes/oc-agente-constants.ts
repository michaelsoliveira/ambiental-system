export const DEFAULT_AGENTE_MODELO = 'gpt-4o-mini';

export const AGENTE_MODELOS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini — Padrão · equilíbrio OpenAI', group: 'OpenAI' },
  { value: 'gpt-4o', label: 'GPT-4o — Alto desempenho', group: 'OpenAI' },
  { value: 'o3-mini', label: 'o3-mini — Raciocínio eficiente', group: 'OpenAI' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 — Equilíbrio', group: 'Anthropic' },
  { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 — Máxima capacidade', group: 'Anthropic' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — Rápido · econômico', group: 'Anthropic' },
  { value: 'deepseek-chat', label: 'DeepSeek V3 — Melhor custo/benefício', group: 'DeepSeek' },
  { value: 'deepseek-reasoner', label: 'DeepSeek R1 — Raciocínio encadeado', group: 'DeepSeek' },
  { value: 'qwen2.5:14b-instruct-q8_0', label: 'Qwen 2.5 14B Q8 — Local', group: 'Local' },
  { value: 'qwen2.5:32b-instruct-q4_K_M', label: 'Qwen 2.5 32B Q4 — Local', group: 'Local' },
  { value: 'phi4:14b-q8_0', label: 'Phi-4 14B Q8 — Local', group: 'Local' },
  { value: 'mistral-small:22b-instruct-q8_0', label: 'Mistral Small 22B Q8 — Local', group: 'Local' },
  { value: 'llama3.2:3b-instruct-q8_0', label: 'Llama 3.2 3B — Local', group: 'Local' },
] as const;

export const MODELO_GROUPS = ['OpenAI', 'Anthropic', 'DeepSeek', 'Local'] as const;
