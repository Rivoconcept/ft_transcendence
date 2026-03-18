
const VAULT_ADDR  = process.env.VAULT_ADDR  || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'root';

export async function loadSecrets(): Promise<void> {
  console.log('🔐 Loading secrets from Vault...');

  try {
    // Stocker les secrets dans Vault
    await fetch(`${VAULT_ADDR}/v1/secret/data/backend`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': VAULT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          JWT_SECRET:     process.env.JWT_SECRET,
          REFRESH_SECRET: process.env.REFRESH_SECRET,
          POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
        }
      })
    });

    //Les relire depuis Vault
    const res = await fetch(`${VAULT_ADDR}/v1/secret/data/backend`, {
      headers: { 'X-Vault-Token': VAULT_TOKEN }
    });

    if (!res.ok) throw new Error(`Vault responded with ${res.status}`);

    const json = await res.json();
    const data = json.data.data;

    //  Injecter en mémoire et supprimer les originaux
    process.env.JWT_SECRET        = data.JWT_SECRET;
    process.env.REFRESH_SECRET    = data.REFRESH_SECRET;
    process.env.POSTGRES_PASSWORD = data.POSTGRES_PASSWORD;

    console.log('✅ Secrets loaded from Vault');

  } catch (err) {
    console.error('❌ Failed to load secrets from Vault:', err);
    process.exit(1);
  }
}