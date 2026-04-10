vault {
  address = "https://vault:8200"
  ca_cert = "/vault/tls/vault.crt"
}

auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/run/secrets/vault/role_id"
      secret_id_file_path = "/run/secrets/vault/wrapped_secret_id"
      secret_id_response_wrapping_path    = "auth/approle/role/gamehub/secret-id"
      unwrap_token = true
      remove_secret_id_after_reading = true
    }
  }
}

template
{
  source      = "/vault/templates/backend.env.ctmpl"
  destination = "/run/secrets/GameHub/backend/backend.env"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/postgres/POSTGRES_USER.ctmpl"
  destination = "/run/secrets/GameHub/postgres/POSTGRES_USER"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/postgres/POSTGRES_DB.ctmpl"
  destination = "/run/secrets/GameHub/postgres/POSTGRES_DB"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/postgres/POSTGRES_PASSWORD.ctmpl"
  destination = "/run/secrets/GameHub/postgres/POSTGRES_PASSWORD"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/pgadmin.env.ctmpl"
  destination = "/run/secrets/GameHub/pgadmin/pgadmin.env"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/certs/waf.external.crt.ctmpl"
  destination = "/run/secrets/GameHub/certs/waf/waf.external.crt"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/certs/waf.external.key.ctmpl"
  destination = "/run/secrets/GameHub/certs/waf/waf.external.key"
  perms       = "0600"
}

template
{
  source      = "/vault/templates/certs/waf.internal.crt.ctmpl"
  destination = "/run/secrets/GameHub/certs/waf/waf.internal.crt"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/certs/waf.internal.key.ctmpl"
  destination = "/run/secrets/GameHub/certs/waf/waf.internal.key"
  perms       = "0600"
}

template
{
  source      = "/vault/templates/certs/frontend.crt.ctmpl"
  destination = "/run/secrets/GameHub/certs/frontend/frontend.crt"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/certs/frontend.key.ctmpl"
  destination = "/run/secrets/GameHub/certs/frontend/frontend.key"
  perms       = "0600"
}

template
{
  source      = "/vault/templates/certs/backend.crt.ctmpl"
  destination = "/run/secrets/GameHub/certs/backend/backend.crt"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/certs/backend.key.ctmpl"
  destination = "/run/secrets/GameHub/certs/backend/backend.key"
  perms       = "0600"
}
  