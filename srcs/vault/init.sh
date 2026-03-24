#!/bin/sh
set -e
set -x

JWT_SECRET=$(grep JWT_SECRET /vault/vault-init | cut -d= -f2)
REFRESH_SECRET=$(grep REFRESH_SECRET /vault/vault-init | cut -d= -f2)
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD /vault/vault-init | cut -d= -f2)
PGADMIN_DEFAULT_PASSWORD=$(grep PGADMIN_DEFAULT_PASSWORD /vault/vault-init | cut -d= -f2)

vault kv put secret/GameHub \
  JWT_SECRET=$JWT_SECRET \
  REFRESH_SECRET=$REFRESH_SECRET \
  POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  PGADMIN_DEFAULT_PASSWORD=$PGADMIN_DEFAULT_PASSWORD

vault kv get -field=POSTGRES_PASSWORD secret/GameHub > /run/secrets/POSTGRES_PASSWORD
vault kv get -field=PGADMIN_DEFAULT_PASSWORD secret/GameHub > /run/secrets/PGADMIN_DEFAULT_PASSWORD

shred -u /vault/vault-init 2>/dev/null || true

echo '✅ vault-init done'

# for field in 
# POSTGRES_PASSWORD
#  PGADMIN_DEFAULT_PASSWORD
#  ; do
#   vault kv get -field=$field secret/GameHub > /run/secrets/$field
# done