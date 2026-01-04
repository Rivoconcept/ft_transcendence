# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rhanitra <rhanitra@student.42antananari    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/07 18:21:32 by rhanitra          #+#    #+#              #
#    Updated: 2025/12/30 14:43:29 by rhanitra         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


NAME = ft_stranscendance

COMPOSE = docker compose
COMPOSE_FILE = -f ./srcs/docker-compose.yml
ENV_FILE = --env-file ./srcs/.env

DOMAIN = rhanitra.42.fr

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0
export USER = $(shell whoami)
export DATA_PATH = /home/$(USER)/data
CERTS_DIR = ./secrets/certs
CRT_FILE = $(CERTS_DIR)/nginx.crt
KEY_FILE = $(CERTS_DIR)/nginx.key

all: init-dirs init-volumes certs up addHost

up:
	$(COMPOSE) $(ENV_FILE) $(COMPOSE_FILE) up -d

build:
	$(COMPOSE) $(ENV_FILE) $(COMPOSE_FILE) build

down:
	$(COMPOSE) $(COMPOSE_FILE) down

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

addHost:
	@if [ "$$(id -u)" -ne 0 ]; then \
		echo "Skipping /etc/hosts (no sudo privileges)"; \
	else \
		grep -qxF "127.0.0.1 $(DOMAIN)" /etc/hosts || \
		echo "127.0.0.1 $(DOMAIN)" >> /etc/hosts; \
	fi

rmHost:
	@echo "Remove host $(DOMAIN)"
	@sudo sed -i '\|127.0.0.1[[:space:]]\+$(DOMAIN)|d' /etc/hosts

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

fclean: down
	docker system prune -af
	@echo "Cleanup done."

re: fclean all

.PHONY: all up build down logs start stop ps exec addHost rmHost init-dirs init-volumes certs fclean re
