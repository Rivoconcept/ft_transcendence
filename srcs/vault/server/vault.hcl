listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/run/secrets/vault.crt"
  tls_key_file  = "/run/secrets/vault.key"
}

storage "raft"
{
  path    = "/vault/data"
  node_id = "node1"
}

api_addr = "https://vault:8200"
cluster_addr = "https://vault:8201"



ui = true