#!/bin/sh
set -e

chown -R vault:vault /vault/data
chown -R vault:vault /vault/logs

setcap cap_ipc_lock=+ep /bin/vault

exec vault server -config=/vault/config/vault.hcl