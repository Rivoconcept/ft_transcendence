#!/bin/sh

# set -a
# eval "$(grep -v '^\s*$' /run/secrets/GameHub/pgadmin/pgadmin.env | grep -v '^\s*#')"
# set +a
while IFS='=' read -r key value; do
  export "$key=$value"
done < /run/secrets/GameHub/pgadmin/pgadmin.env


cat > /tmp/servers.json <<EOF
{
  "Servers": {
    "1": {
      "Name": "${PGADMIN_SERVER_NAME}",
      "Group": "Servers",
      "Host": "${DB_HOST}",
      "Port": ${DB_PORT},
      "MaintenanceDB": "${POSTGRES_DB}",
      "Username": "${POSTGRES_USER}",
      "
      "SSLMode": "prefer"
    }
  }
}
EOF

exec /entrypoint.sh
