#!/bin/sh

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
