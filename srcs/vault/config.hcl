auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/run/secrets/vault/role-id"
      secret_id_file_path = "/run/secrets/vault/wrapped-secret-id"
      secret_id_response_wrapping_path = "auth/approle/role/gamehub/secret-id"
      remove_secret_id_file_after_reading = false
    }
  }
}

vault {
  address = "http://vault:8200"
}

template
{
  source      = "/vault/templates/backend.env.ctmpl"
  destination = "/run/secrets/GameHub/backend/backend.env"
  perms       = "0644"
}

template
{
  source      = "/vault/templates/postgres-password.ctmpl"
  destination = "/run/secrets/GameHub/postgres/POSTGRES_PASSWORD"
  perms       = "0600"
}

template
{
  source      = "/vault/templates/pgadmin-password.ctmpl"
  destination = "/run/secrets/GameHub/pgadmin/PGADMIN_DEFAULT_PASSWORD"
  perms       = "0600"
}


