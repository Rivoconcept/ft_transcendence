#!/bin/sh
set -e 
set -x

export VAULT_CACERT=/run/secrets/vault.crt
export VAULT_ADDR=https://vault:8200

# ---- INIT ----
if ! vault status -tls-skip-verify | grep -q "Initialized.*true"; then
  echo "⏳ Initializing Vault..."
  vault operator init \
    -key-shares=1 \
    -key-threshold=1 \
    -format=json > /tmp/vault-init.json

  UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' /tmp/vault-init.json)
  ROOT_TOKEN=$(jq -r '.root_token' /tmp/vault-init.json)

  echo "$UNSEAL_KEY" > /run/secrets/vault/unseal_key
  echo "$ROOT_TOKEN" > /run/secrets/vault/root_token

  export VAULT_TOKEN=$ROOT_TOKEN
  echo "✅ Vault initialized"
else
  UNSEAL_KEY=$(cat /run/secrets/vault/unseal_key)
  ROOT_TOKEN=$(cat /run/secrets/vault/root_token)
  export VAULT_TOKEN=$ROOT_TOKEN
fi

# ---- UNSEAL ----
if vault status -tls-skip-verify | grep -q "Sealed.*true"; then
  echo "⏳ Unsealing Vault..."
  vault operator unseal $UNSEAL_KEY
  echo "✅ Vault unsealed"
fi

# ---- ENABLE KV ----
vault secrets enable -version=2 -path=secret kv 2>/dev/null || true
echo "✅ KV engine enabled"


export VAULT_TOKEN=$(cat /run/secrets/vault/root_token)

NODE_ENV=$(jq -r .NODE_ENV /run/secrets/init.json)
BACKEND_PORT=$(jq -r .BACKEND_PORT /run/secrets/init.json)
JWT_SECRET=$(jq -r .JWT_SECRET /run/secrets/init.json)
JWT_EXPIRES_IN=$(jq -r .JWT_EXPIRES_IN /run/secrets/init.json)
REFRESH_SECRET=$(jq -r .REFRESH_SECRET /run/secrets/init.json)
REFRESH_EXPIRES_IN=$(jq -r .REFRESH_EXPIRES_IN /run/secrets/init.json)
DB_HOST=$(jq -r .DB_HOST /run/secrets/init.json)
DB_PORT=$(jq -r .DB_PORT /run/secrets/init.json)
POSTGRES_DB=$(jq -r .POSTGRES_DB /run/secrets/init.json)
POSTGRES_USER=$(jq -r .POSTGRES_USER /run/secrets/init.json)
POSTGRES_PASSWORD=$(jq -r .POSTGRES_PASSWORD /run/secrets/init.json)
PGADMIN_SERVER_NAME=$(jq -r .PGADMIN_SERVER_NAME /run/secrets/init.json)
PGADMIN_DEFAULT_EMAIL=$(jq -r .PGADMIN_DEFAULT_EMAIL /run/secrets/init.json)
PGADMIN_DEFAULT_PASSWORD=$(jq -r .PGADMIN_DEFAULT_PASSWORD /run/secrets/init.json)
SMTP_HOST=$(jq -r .SMTP_HOST /run/secrets/init.json)
SMTP_PORT=$(jq -r .SMTP_PORT /run/secrets/init.json)
SMTP_USER=$(jq -r .SMTP_USER /run/secrets/init.json)
SMTP_PASS=$(jq -r .SMTP_PASS /run/secrets/init.json)
SMTP_FROM=$(jq -r .SMTP_FROM /run/secrets/init.json)

# ---- VALIDATION ----
[ -z "$JWT_SECRET" ] && exit 1
[ -z "$POSTGRES_PASSWORD" ] && exit 1
[ -z "$PGADMIN_DEFAULT_PASSWORD" ] && exit 1

echo "✅ Secrets loaded"

# ---- WRITE SECRETS ----
vault kv put secret/GameHub/backend \
  NODE_ENV="$NODE_ENV" \
  PORT="$BACKEND_PORT" \
  JWT_SECRET="$JWT_SECRET" \
  JWT_EXPIRES_IN="$JWT_EXPIRES_IN" \
  REFRESH_SECRET="$REFRESH_SECRET" \
  REFRESH_EXPIRES_IN="$REFRESH_EXPIRES_IN" \
  SMTP_HOST="$SMTP_HOST" \
  SMTP_PORT="$SMTP_PORT" \
  SMTP_USER="$SMTP_USER" \
  SMTP_PASS="$SMTP_PASS" \
  SMTP_FROM="$SMTP_FROM"

vault kv put secret/GameHub/postgres \
  DB_HOST="$DB_HOST" \
  DB_PORT="$DB_PORT" \
  POSTGRES_DB="$POSTGRES_DB" \
  POSTGRES_USER="$POSTGRES_USER" \
  POSTGRES_PASSWORD="$POSTGRES_PASSWORD"

vault kv put secret/GameHub/pgadmin \
  PGADMIN_SERVER_NAME="$PGADMIN_SERVER_NAME" \
  PGADMIN_DEFAULT_EMAIL="$PGADMIN_DEFAULT_EMAIL" \
  PGADMIN_DEFAULT_PASSWORD="$PGADMIN_DEFAULT_PASSWORD"

echo "✅ Secrets stored"

# ---- PKI ----
vault secrets enable -path=pki pki 2>/dev/null || true

vault write pki/root/generate/internal \
  common_name="gamehub-root" \
  ttl=87600h 2>/dev/null || true

vault write pki/config/urls \
  issuing_certificates="https://vault:8200/v1/pki/ca" \
  crl_distribution_points="https://vault:8200/v1/pki/crl"

vault write pki/roles/web-internal \
  allowed_domains="internal" \
  allow_subdomains=true \
  max_ttl="720h" \
  key_type=rsa \
  key_bits=2048 2>/dev/null || true

vault write pki/roles/web-external \
  allowed_domains="localhost,external" \
  allow_subdomains=true \
  max_ttl="720h" \
  key_type=rsa \
  key_bits=2048 2>/dev/null || true

echo "✅ PKI configured"

# ---- POLICY ----
vault policy write gamehub-policy - <<EOF
path "secret/data/GameHub/*" {
  capabilities = ["read"]
}

path "pki/issue/web-internal" {
  capabilities = ["create", "update", "read"]
}

path "pki/issue/web-external" {
  capabilities = ["create", "update", "read"]
}
EOF

# ---- APPROLE ----
vault auth enable approle 2>/dev/null || true

vault write auth/approle/role/gamehub \
  token_policies="gamehub-policy" \
  token_ttl=1h \
  token_max_ttl=4h

ROLE_ID=$(vault read -field=role_id auth/approle/role/gamehub/role-id)

WRAPPING_TOKEN=$(vault write -force -wrap-ttl=10m \
  -field=wrapping_token \
  auth/approle/role/gamehub/secret-id)

# ---- STORE ----
mkdir -p /run/secrets/vault
echo "$ROLE_ID" > /run/secrets/vault/role_id
echo "$WRAPPING_TOKEN" > /run/secrets/vault/wrapped_secret_id
chmod 600 /run/secrets/vault/wrapped_secret_id
chown 1000:1000 /run/secrets/vault/wrapped_secret_id

chmod 640 /run/secrets/vault/*
chown 1000:1000 /run/secrets/vault/*
echo "✅ AppRole credentials stored"

# ---- DIRECTORIES ----
mkdir -p /run/secrets/GameHub/{backend,postgres,pgadmin,certs}
chmod 755 /run/secrets/GameHub
chown 1000:1000 /run/secrets/GameHub
echo "✅ vault-init done"