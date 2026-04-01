#!/bin/sh
set -e
set -x

JWT_SECRET=$(grep JWT_SECRET /vault/vault-init | cut -d= -f2 | tr -d '\r')
REFRESH_SECRET=$(grep REFRESH_SECRET /vault/vault-init | cut -d= -f2| tr -d '\r')
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD /vault/vault-init | cut -d= -f2| tr -d '\r')
PGADMIN_DEFAULT_PASSWORD=$(grep PGADMIN_DEFAULT_PASSWORD /vault/vault-init | cut -d= -f2| tr -d '\r')
NODE_ENV=$(grep NODE_ENV /vault/vault-init | cut -d= -f2| tr -d '\r')
BACKEND_PORT=$(grep BACKEND_PORT /vault/vault-init | cut -d= -f2| tr -d '\r')
JWT_EXPIRES_IN=$(grep JWT_EXPIRES_IN /vault/vault-init | cut -d= -f2| tr -d '\r')
REFRESH_EXPIRES_IN=$(grep REFRESH_EXPIRES_IN /vault/vault-init | cut -d= -f2| tr -d '\r')

vault kv put secret/GameHub \
  JWT_SECRET=$JWT_SECRET \
  REFRESH_SECRET=$REFRESH_SECRET \
  POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  PGADMIN_DEFAULT_PASSWORD=$PGADMIN_DEFAULT_PASSWORD \
  NODE_ENV=$NODE_ENV \
  PORT=$BACKEND_PORT \
  JWT_EXPIRES_IN=$JWT_EXPIRES_IN \
  REFRESH_EXPIRES_IN=$REFRESH_EXPIRES_IN

vault policy write backend-policy - <<EOF
path "secret/data/GameHub" {
  capabilities = ["read"]
}
EOF

vault auth enable approle 2>/dev/null || true

vault write auth/approle/role/backend \
  token_policies="backend-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=10m \
  secret_id_num_uses=3

ROLE_ID=$(vault read -field=role_id auth/approle/role/backend/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/backend/secret-id)

echo $ROLE_ID   > /run/secrets/VAULT_ROLE_ID
echo $SECRET_ID > /run/secrets/VAULT_SECRET_ID

vault kv get -field=POSTGRES_PASSWORD secret/GameHub > /run/secrets/POSTGRES_PASSWORD
vault kv get -field=PGADMIN_DEFAULT_PASSWORD secret/GameHub > /run/secrets/PGADMIN_DEFAULT_PASSWORD

shred -u /run/secrets/vault-init 2>/dev/null || true

echo '✅ vault-init done'
