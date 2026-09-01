# Landing CMS — admin no ambiental-system (P3)

Portal administrativo do conteúdo da **ambiental-landing**, hospedado no app `financeiro`.

## Rotas

| Método | Path | Auth | Uso |
|--------|------|------|-----|
| GET | `/organizations/:slug/landing` | JWT + CASL `get LandingContent` | Carregar draft |
| PUT | `/organizations/:slug/landing/draft` | JWT + CASL `update` | Salvar rascunho |
| POST | `/organizations/:slug/landing/publish` | JWT + CASL `publish`/`manage` | Publicar |
| GET | `/public/landing/:slug` | Público | Site lê conteúdo publicado |
| GET | `/public/landing/:slug?draft=1&secret=` | Secret | Preview draft |

## UI

- Menu: Configurações → **CMS Landing**
- Página: `/org/[slug]/landing-cms`
- Env no financeiro: `NEXT_PUBLIC_LANDING_URL`, `NEXT_PUBLIC_LANDING_PREVIEW_SECRET` (opcional)
- Env na API: `LANDING_PREVIEW_SECRET` (mesmo valor do secret de preview)

## Modelo

`common.landing_sites` — um registro por organização (`draft_content` + `published_content` JSON).

## Landing

```env
CMS_PROVIDER=api
CMS_API_URL=http://localhost:3333
CMS_ORG_SLUG=<slug-da-org>
LANDING_PREVIEW_SECRET=<mesmo-da-api>
PREVIEW_SECRET=<mesmo-valor>   # /api/preview e /api/revalidate
```

## Financeiro (opcional — revalidate após publicar)

```env
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_LANDING_PREVIEW_SECRET=<mesmo-PREVIEW_SECRET-da-landing>
```

**Importante:** “Salvar rascunho” não altera o site público. Só **Publicar** atualiza o que a landing exibe.

## Mídia (MinIO)

No Hero (e futuramente outras seções), o CMS permite:

- escolher **tipo** (`none` | `image` | `video`)
- escolher **motion** (`none` | `kenburns` | `parallax`)
- **upload** para o MinIO ou **biblioteca** (find) de arquivos já enviados
- ajustes: `alt`, `poster` (vídeo)

| Método | Path | Uso |
|--------|------|-----|
| POST | `/organizations/:slug/landing/media` | multipart `file` → MinIO |
| GET | `/organizations/:slug/landing/media?kind=` | listar biblioteca |

Env da API (ver `docker/env.example`):

```env
MINIO_ENDPOINT=minio.ambiental.com.br
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=landing-media
MINIO_PUBLIC_URL=https://minio.ambiental.com.br/landing-media
```

O bucket precisa permitir leitura pública do prefixo `landing/` (ou política equivalente), pois a landing consome a URL pública direta.