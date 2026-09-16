# Keycloak — SSO compartilhado

Issuer: `http://localhost:8081/realms/ambiental`

## Usuários já existentes (sem cadastrar de novo)

O iNexaHub (e o SST) **já vinculam** o token OIDC ao `User` local pelo **e-mail**.
O que faltava era o Keycloak ter uma identidade para autenticar — senão seria preciso criar cada pessoa no console.

Isso é resolvido com **User Federation** (`keycloak-user-migration`):

1. No primeiro **Entrar com SSO**, o Keycloak pergunta e-mail/senha.
2. O plugin chama `GET/POST http://host.docker.internal:8000/api/v1/auth/legacy/{email}`.
3. O backend valida contra a tabela `users` (mesma senha de sempre).
4. O Keycloak **importa** esse usuário no realm. Nos logins seguintes não consulta mais a API.
5. O app recebe o JWT e liga pelo e-mail (`auth_id`); papéis/clínica **continuam no app**.

### Ativar (dev)

O backend precisa de:

```
OIDC_LEGACY_MIGRATION_TOKEN=inexahub-legacy-mig-k7Qx9mP2wR4nT8vL
```

(mesmo valor configurado na federação.)

```bash
cd infra/keycloak
chmod +x download-provider.sh enable-legacy-federation.sh
./download-provider.sh
docker compose up -d --force-recreate
./enable-legacy-federation.sh
```

Realm já criado **não** reimporta `realm-ambiental.json`. Por isso o script `enable-legacy-federation.sh` é obrigatório na primeira vez.

No login do Keycloak use o **e-mail** (ou o username) e a **senha atual do iNexaHub**.

### Outros produtos (licenças, ambiental-system)

Cada produto tem a própria tabela de usuários. A federação acima aponta para o **iNexaHub**.
Se a pessoa só existe em outro app, ou a senha é outra, esse app precisa do mesmo par GET/POST `/legacy` — ou o e-mail precisa existir no iNexaHub.

Depois do primeiro SSO, o e-mail no token basta para o JIT/link dos demais apps.

### O que não fazer

- Não copiar papéis/clínica para o Keycloak.
- Não criar usuários à mão no realm para quem já está no banco do produto.
- Não ligar `MIGRATE_UNMAPPED_ROLES` — RBAC fica no app.
