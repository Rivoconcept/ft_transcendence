#!/bin/bash

CONTAINER_NAME="postgres"
DATA_PATH="/var/lib/postgresql/data"

echo "🔧 Changing permissions inside container..."

docker exec -it $CONTAINER_NAME bash -c "
	if [ -d \"$DATA_PATH\" ]; then
		chmod -R 777 $DATA_PATH && echo 'Permissions updated ✔';
	else
		echo 'Data directory not found ❌';
	fi
"

echo "🧹 Removing data directory from host..."

rm -rf ~/data/db_data

echo "✅ Database cleaned."