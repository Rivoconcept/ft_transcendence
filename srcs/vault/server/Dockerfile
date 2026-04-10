FROM hashicorp/vault:1.15

USER root

RUN apk add --no-cache libcap && \
    setcap cap_ipc_lock=+ep /bin/vault

COPY vault.sh /vault/entrypoint.sh
RUN chmod +x /vault/entrypoint.sh

ENTRYPOINT ["/vault/entrypoint.sh"]