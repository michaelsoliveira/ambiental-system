#!/usr/bin/env bash
# Cria (ou recria) a User Federation que consulta o iNexaHub.
# O realm já importado NÃO reaplica realm-ambiental.json (IGNORE_EXISTING).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
URI="${LEGACY_URI:-http://host.docker.internal:8000/api/v1/auth/legacy}"
TOKEN="${OIDC_LEGACY_MIGRATION_TOKEN:-inexahub-legacy-mig-k7Qx9mP2wR4nT8vL}"
PROVIDER_ID="User migration using a REST client"
COMPOSE=(docker compose -f "$DIR/docker-compose.yml")

if [[ ! -f "$DIR/providers/keycloak-rest-provider-6.0.0.jar" ]]; then
  echo "JAR ausente. Rode primeiro: $DIR/download-provider.sh"
  exit 1
fi

kcadm() {
  "${COMPOSE[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"
}

echo "Autenticando no Keycloak (master)..."
kcadm config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user "${KEYCLOAK_ADMIN:-admin}" \
  --password "${KEYCLOAK_ADMIN_PASSWORD:-admin}"

REALM_ID="$(kcadm get realms/ambiental --fields id --format csv --noquotes)"
if [[ -z "$REALM_ID" ]]; then
  echo "Realm ambiental não encontrado."
  exit 1
fi

EXISTING="$(kcadm get components -r ambiental --fields id,name,providerId --format csv --noquotes \
  | awk -F, -v name="inexahub-legacy-users" '$2==name {print $1; exit}')"
if [[ -n "${EXISTING:-}" ]]; then
  echo "Removendo federação anterior ($EXISTING)..."
  kcadm delete "components/$EXISTING" -r ambiental
fi

echo "Criando User Federation → $URI"
kcadm create components -r ambiental \
  -s name=inexahub-legacy-users \
  -s "providerId=$PROVIDER_ID" \
  -s providerType=org.keycloak.storage.UserStorageProvider \
  -s "parentId=$REALM_ID" \
  -s "config.URI=[\"$URI\"]" \
  -s 'config.API_TOKEN_ENABLED=["true"]' \
  -s "config.API_TOKEN=[\"$TOKEN\"]" \
  -s 'config.MIGRATE_UNMAPPED_ROLES=["false"]' \
  -s 'config.MIGRATE_UNMAPPED_GROUPS=["false"]'

echo "OK. No primeiro SSO, o usuário existente do iNexaHub entra com e-mail e senha atuais."
echo "Confira: http://localhost:8081 → Realm ambiental → User federation"
