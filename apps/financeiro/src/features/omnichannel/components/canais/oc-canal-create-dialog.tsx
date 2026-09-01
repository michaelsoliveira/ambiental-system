'use client';

import { useState } from 'react';
import { Copy, LayoutTemplate, MessageCircle, Send } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  useOcCanalLandingFormCreate,
  useOcCanalLandingIngestUrlQuery,
  useOcCanalWebhookUrlQuery,
  useOcCanalWhatsappCreate,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcCanalListItem } from '@/features/omnichannel/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Step = 'tipo' | 'evolution' | 'landing' | 'landing-done';

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copiado!'),
    () => toast.error('Não foi possível copiar'),
  );
}

export function OcCanalCreateDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('tipo');
  const [nome, setNome] = useState('');
  const [token, setToken] = useState('');
  const [createdLanding, setCreatedLanding] = useState<OcCanalListItem | null>(
    null,
  );

  const { data: webhookMeta } = useOcCanalWebhookUrlQuery(open && step === 'evolution');
  const { data: landingMeta } = useOcCanalLandingIngestUrlQuery(
    open && (step === 'landing' || step === 'landing-done'),
  );
  const criarWhatsapp = useOcCanalWhatsappCreate();
  const criarLanding = useOcCanalLandingFormCreate();

  const reset = () => {
    setStep('tipo');
    setNome('');
    setToken('');
    setCreatedLanding(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleCreateWhatsapp = () => {
    if (!nome.trim()) return;
    criarWhatsapp.mutate(
      {
        nome: nome.trim(),
        token: token.trim() || undefined,
      },
      {
        onSuccess: () => handleClose(false),
      },
    );
  };

  const handleCreateLanding = () => {
    if (!nome.trim()) return;
    criarLanding.mutate(
      { nome: nome.trim() },
      {
        onSuccess: (canal) => {
          setCreatedLanding(canal);
          setStep('landing-done');
        },
      },
    );
  };

  const webhookUrl = webhookMeta?.webhook_url ?? '';
  const ingestUrl =
    createdLanding?.ingest_url ?? landingMeta?.ingest_url ?? '';
  const ingestSecret = createdLanding?.ingest_secret ?? '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="md:max-w-lg">
        {step === 'tipo' ? (
          <>
            <DialogHeader>
              <DialogTitle>Novo canal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <button
                type="button"
                onClick={() => setStep('evolution')}
                className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-emerald-50">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Via Evolution API</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNome('Formulário Landing');
                  setStep('landing');
                }}
                className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-primary/10">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Formulário da landing</p>
                  <p className="text-xs text-muted-foreground">
                    Leads do site institucional → inbox omnichannel
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 opacity-60">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                  <Send className="h-5 w-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Telegram</p>
                  <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 opacity-60">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                  <SiInstagram className="h-5 w-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Instagram</p>
                  <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
              </div>
            </div>
          </>
        ) : step === 'evolution' ? (
          <>
            <DialogHeader>
              <DialogTitle>Configurar Evolution API</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome do canal</Label>
                <Input
                  placeholder="Ex: WhatsApp Principal"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Token da instância (opcional)</Label>
                <Input
                  placeholder="Token Evolution API — se exigido pelo servidor"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  O webhook é configurado automaticamente na criação da instância.
                </p>
              </div>

              {webhookUrl ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    URL do Webhook (já aplicada na instância Evolution):
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-background px-2 py-1.5">
                    <code className="flex-1 truncate text-[11px]">{webhookUrl}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyText(webhookUrl)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  Configure EVOLUTION_WEBHOOK_PUBLIC_URL (e EVOLUTION_API_BASE_URL /
                  EVOLUTION_API_GLOBAL_KEY) no .env da API.
                </p>
              )}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('tipo')}>
                Voltar
              </Button>
              <Button
                onClick={handleCreateWhatsapp}
                disabled={!nome.trim() || criarWhatsapp.isPending}
              >
                {criarWhatsapp.isPending ? 'Criando…' : 'Criar Canal'}
              </Button>
            </DialogFooter>
          </>
        ) : step === 'landing' ? (
          <>
            <DialogHeader>
              <DialogTitle>Formulário da landing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Cada envio do formulário de contato do site abre uma conversa no
                inbox com o lead (nome, empresa, e-mail, telefone e mensagem).
              </p>
              <div className="space-y-1.5">
                <Label>Nome do canal</Label>
                <Input
                  placeholder="Ex: Formulário Landing"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              {ingestUrl ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Endpoint público (a landing chama via proxy server-side):
                  </p>
                  <code className="block break-all text-[11px]">{ingestUrl}</code>
                </div>
              ) : null}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('tipo')}>
                Voltar
              </Button>
              <Button
                onClick={handleCreateLanding}
                disabled={!nome.trim() || criarLanding.isPending}
              >
                {criarLanding.isPending ? 'Criando…' : 'Criar Canal'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Canal criado — configure a landing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Adicione estas variáveis no <code className="text-xs">.env</code>{' '}
                da <strong>ambiental-landing</strong> e reinicie o Next.js:
              </p>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    CMS_API_URL / endpoint
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all text-[11px]">{ingestUrl}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyText(ingestUrl)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    OMNICHANNEL_INGEST_SECRET
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all text-[11px]">{ingestSecret}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyText(ingestSecret)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Use o mesmo <code>CMS_ORG_SLUG</code> da organização deste canal.
                  Guarde o secret — ele autentica o envio do formulário.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Concluir</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
