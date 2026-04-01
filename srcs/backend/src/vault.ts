import * as fs from 'fs';

const VAULT_ADDR = process.env.VAULT_ADDR

async function getVaultToken(): Promise<string> {
  try {
    const roleId = fs.readFileSync('/run/secrets/VAULT_ROLE_ID', 'utf8').trim();
    const secretId = fs.readFileSync('/run/secrets/VAULT_SECRET_ID', 'utf8').trim();

    const res = await fetch(`${VAULT_ADDR}/v1/auth/approle/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId, secret_id: secretId })
    });

    if (!res.ok) throw new Error(`AppRole auth failed: ${res.status}`);
    const json = await res.json();
    return json.auth.client_token;

  } catch {
    // dev without Approle
    return process.env.VAULT_TOKEN || 'root';
  }
}

export async function loadSecrets(): Promise<void> {
  console.log('🔐 Loading secrets from Vault...');

  try {

    const token = await getVaultToken();
    const res = await fetch(`${VAULT_ADDR}/v1/secret/data/GameHub`, {
      headers: { 'X-Vault-Token': token }
    });

    if (!res.ok) throw new Error(`Vault responded with ${res.status}`);

    const json = await res.json();
    const data = json.data.data;

    process.env.JWT_SECRET = data.JWT_SECRET;
    process.env.REFRESH_SECRET = data.REFRESH_SECRET;
    process.env.POSTGRES_PASSWORD = data.POSTGRES_PASSWORD;
    process.env.JWT_EXPIRES_IN = data.JWT_EXPIRES_IN;
    process.env.REFRESH_EXPIRES_IN = data.REFRESH_EXPIRES_IN;
    process.env.NODE_ENV = data.NODE_ENV;
    process.env.PORT = data.PORT;

    console.log('✅ Secrets loaded from Vault');

  } catch (err) {
    console.error('❌ Failed to load secrets from Vault:', err);
    process.exit(1);
  }
}