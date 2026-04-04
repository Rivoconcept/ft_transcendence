#!/bin/sh
set -e
set -x

# JWT_SECRET=$(grep JWT_SECRET /vault/vault-init | cut -d= -f2 | tr -d '\r')
# REFRESH_SECRET=$(grep REFRESH_SECRET /vault/vault-init | cut -d= -f2| tr -d '\r')
# POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD /vault/vault-init | cut -d= -f2| tr -d '\r')
# PGADMIN_DEFAULT_PASSWORD=$(grep PGADMIN_DEFAULT_PASSWORD /vault/vault-init | cut -d= -f2| tr -d '\r')
# NODE_ENV=$(grep NODE_ENV /vault/vault-init | cut -d= -f2| tr -d '\r')
# BACKEND_PORT=$(grep BACKEND_PORT /vault/vault-init | cut -d= -f2| tr -d '\r')
# JWT_EXPIRES_IN=$(grep JWT_EXPIRES_IN /vault/vault-init | cut -d= -f2| tr -d '\r')
# REFRESH_EXPIRES_IN=$(grep REFRESH_EXPIRES_IN /vault/vault-init | cut -d= -f2| tr -d '\r')

JWT_SECRET=$(jq -r .JWT_SECRET /vault/vault-init.json)
REFRESH_SECRET=$(jq -r .REFRESH_SECRET /vault/vault-init.json)
POSTGRES_PASSWORD=$(jq -r .POSTGRES_PASSWORD /vault/vault-init.json)
PGADMIN_DEFAULT_PASSWORD=$(jq -r .PGADMIN_DEFAULT_PASSWORD /vault/vault-init.json)
NODE_ENV=$(jq -r .NODE_ENV /vault/vault-init.json)
BACKEND_PORT=$(jq -r .BACKEND_PORT /vault/vault-init.json)
JWT_EXPIRES_IN=$(jq -r .JWT_EXPIRES_IN /vault/vault-init.json)
REFRESH_EXPIRES_IN=$(jq -r .REFRESH_EXPIRES_IN /vault/vault-init.json)

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "null" ]; then
  echo "❌ Secret 'JWT_SECRET' manquant ou invalide" >&2
  exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "null" ]; then
  echo "❌ Secret 'POSTGRES_PASSWORD' manquant ou invalide" >&2
  exit 1
fi

if [ -z "$PGADMIN_DEFAULT_PASSWORD" ] || [ "$PGADMIN_DEFAULT_PASSWORD" = "null" ]; then
  echo "❌ Secret 'PGADMIN_DEFAULT_PASSWORD' manquant ou invalide" >&2
  exit 1
fi

echo "✅ All critical secrets are present"

vault kv put secret/GameHub/backend \
  JWT_SECRET=$JWT_SECRET \
  REFRESH_SECRET=$REFRESH_SECRET \
  NODE_ENV=$NODE_ENV \
  PORT=$BACKEND_PORT \
  JWT_EXPIRES_IN=$JWT_EXPIRES_IN \
  REFRESH_EXPIRES_IN=$REFRESH_EXPIRES_IN

vault kv put secret/GameHub/postgres\
  POSTGRES_PASSWORD=$POSTGRES_PASSWORD

vault kv put secret/GameHub/pgadmin\
  PGADMIN_DEFAULT_PASSWORD=$PGADMIN_DEFAULT_PASSWORD

echo "✅ Secrets pushed to Vault"
# vault kv put secret/GameHub/backend @vault-init-data.json -merge || true
# vault kv put secret/GameHub/db @vault-init-data.json -merge || true
# vault kv put secret/GameHub \
#   JWT_SECRET="$JWT_SECRET" \
#   REFRESH_SECRET="$REFRESH_SECRET" \
#   NODE_ENV="$NODE_ENV" \
#   PORT="$BACKEND_PORT" \
#   JWT_EXPIRES_IN="$JWT_EXPIRES_IN" \
#   REFRESH_EXPIRES_IN="$REFRESH_EXPIRES_IN" \
#   POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
#   PGADMIN_DEFAULT_PASSWORD=$PGADMIN_DEFAULT_PASSWORD \

# { echo "❌ Échec de l'écriture dans Vault"; exit 1; }

vault secrets enable -path=pki pki || true
vault secrets tune -max-lease-ttl=87600h pki || true

vault write pki/root/generate/internal \
    common_name=gamehub-root \
  ttl=87600h || true

vault write pki/roles/web-internal \
  allowed_domains="backend.gamehub.local,gamehub.local,localhost" \
  allow_subdomains=true \
  max_ttl="720h" \
  key_type=rsa \
  key_bits=4096 || true

vault write pki/roles/web-external \
  allowed_domains="localhost,gamehub.local,waf.gamehub.local" \
  allow_subdomains=true \
  allow_bare_domains=true \
  max_ttl="720h" \
  key_type=rsa \
  key_bits=4096 || true

vault policy write gamehub-policy - <<EOF
path "secret/data/GameHub/postgres"
{
  capabilities = ["read"]
}
path "secret/data/GameHub/pgadmin"
{
  capabilities = ["read"]
}
path "secret/data/GameHub/backend"
{
  capabilities = ["read"]
}
path "pki/issue/web-internal"
{
  capabilities = ["create", "read", "update"]
}
path "pki/issue/web-external"
{
  capabilities = ["create", "read", "update"]
}
path "pki/cert/ca"
{
  capabilities = ["read"]
}
path "pki/issuer/default"
{
  capabilities = ["read"]
}
path "pki/roles/web-*"
{
  capabilities = ["read"]
}
EOF

# vault policy write gamehub-policy - <<EOF
# path "secret/data/GameHub"
# {
#   capabilities = ["read"]
# }
# EOF

vault auth enable approle 2>/dev/null || true

vault write auth/approle/role/gamehub \
  token_policies="gamehub-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=10m \
  secret_id_num_uses=0 || true

echo "✅ AppRole created"
#  { echo "❌ Échec de la création du rôle AppRole"; exit 1; }


ROLE_ID=$(vault read -field=role_id auth/approle/role/gamehub/role-id)
if [ -z "$ROLE_ID" ]; then
  echo "❌ Failed to read role_id" >&2
  exit 1
fi

WRAPPING_TOKEN=$(vault write -force -field=wrapping_token -wrap-ttl=10m auth/approle/role/gamehub/secret-id)

echo "$ROLE_ID" > /run/secrets/vault/role-id
echo "$WRAPPING_TOKEN" > /run/secrets/vault/wrapped-secret-id
# echo $ROLE_ID   > /run/secrets/VAULT_ROLE_ID
# echo $SECRET_ID > /run/secrets/VAULT_SECRET_ID
echo "✅ Role ID and Wrapping Token generated"
echo "Role ID length: ${#ROLE_ID}"
echo "Wrapping Token length: ${#WRAPPING_TOKEN}"
# vault kv get -field=POSTGRES_PASSWORD secret/GameHub/postgres > /run/secrets/POSTGRES_PASSWORD
# vault kv get -field=PGADMIN_DEFAULT_PASSWORD secret/GameHub/pgadmin > /run/secrets/PGADMIN_DEFAULT_PASSWORD

shred -u /vault/vault-init 2>/dev/null || true
shred -u /run/secrets/vault-init 2>/dev/null || true

echo "✅ vault-init done"
