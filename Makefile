# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rhanitra <rhanitra@student.42antananari    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/07 18:21:32 by rhanitra          #+#    #+#              #
#    Updated: 2026/01/05 18:16:19 by rhanitra         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


NAME = ft_transcendance

COMPOSE = docker compose

MODE ?= dev  # valeur par défaut = dev

ifeq ($(MODE),prod)
  COMPOSE_FILE := -f ./srcs/docker-compose-prod.yml
else
  COMPOSE_FILE := -f ./srcs/docker-compose-dev.yml
endif

ENV_FILE = --env-file ./srcs/.env

DOMAIN = localhost

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0
export DATA_PATH = $(HOME)/data
CERTS_DIR = ./secrets/certs
CRT_FILE = $(CERTS_DIR)/nginx.crt
KEY_FILE = $(CERTS_DIR)/nginx.key

DATA_DIR = /home/arajaona/data/db_data

all: init-dirs init-volumes certs up

up:
	$(COMPOSE) $(ENV_FILE) $(COMPOSE_FILE) up -d

build:
	$(COMPOSE) $(ENV_FILE) $(COMPOSE_FILE) build

down:
	$(COMPOSE) $(COMPOSE_FILE) down -v

logs:
	$(COMPOSE) $(COMPOSE_FILE) logs -f

start:
	$(COMPOSE) $(COMPOSE_FILE) start

stop:
	$(COMPOSE) $(COMPOSE_FILE) stop

ps:
	$(COMPOSE) $(COMPOSE_FILE) ps

exec:
	$(COMPOSE) $(COMPOSE_FILE) exec


init-dirs:
	@if [ ! -d "$(DATA_PATH)/db_data" ]; then \
		mkdir -p "$(DATA_PATH)/db_data"; \
		echo "Created: $(DATA_PATH)/db_data"; \
	fi
	@chmod 755 "$(DATA_PATH)"
	@if ! grep -q "DATA_PATH=" srcs/.env; then \
		echo "DATA_PATH=$(DATA_PATH)" >> srcs/.env; \
	fi
	@if ! grep -q "USER=" srcs/.env; then \
		echo "USER=$(USER)" >> srcs/.env; \
	fi

init-volumes:
	@if ! docker volume inspect db_data >/dev/null 2>&1; then \
		docker volume create --name db_data \
			--opt type=none \
			--opt device=$(DATA_PATH)/db_data \
			--opt o=bind; \
	fi

certs:
	@if [ -f "$(CRT_FILE)" ] && [ -f "$(KEY_FILE)" ]; then \
		echo "SSL certificates already exist ✔"; \
	else \
		echo "Generating SSL certificates..."; \
		mkdir -p $(CERTS_DIR); \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout $(KEY_FILE) \
			-out $(CRT_FILE) \
			-subj "/C=FR/ST=France/L=Paris/O=42/OU=Inception/CN=$(DOMAIN)"; \
		chmod 600 $(KEY_FILE); \
		chmod 644 $(CRT_FILE); \
	fi

logback:
	docker logs -f backend-dev

logfront:
	docker logs -f frontend-dev

execback:
	docker exec -it backend-dev /bin/sh

execfront:
	docker exec -it backend-dev /bin/sh

execdb:
	docker exec -it postgres /bin/sh

cleandb:
	sudo rm -rf $(DATA_DIR)

restart: down cleandb all

fclean: down cleandb
	docker system prune -af
	@echo "Cleanup done."

re: fclean all

.PHONY: all up build down logs start stop ps exec addHost rmHost init-dirs init-volumes certs fclean re
