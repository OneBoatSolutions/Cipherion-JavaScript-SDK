import { CipherionClient, CipherionConfig, MigrationOptions } from '@cipherion/client';

interface UserData {
  id: number;
  name: string;
  email: string;
  sensitiveInfo: string;
}

async function typescriptExample(): Promise<void> {
  const config: CipherionConfig = {
    baseUrl: process.env.CIPHERION_BASE_URL!,
    projectId: process.env.CIPHERION_PROJECT_ID!,
    apiKey: process.env.CIPHERION_API_KEY!,
    passphrase: process.env.CIPHERION_PASSPHRASE!,
    logLevel: 'info',
    enableLogging: true,
  };

  const client = new CipherionClient(config);

  try {
    const userData: UserData = {
      id: 1,
      name: "Jane Smith",
      email: "jane@example.com",
      sensitiveInfo: "Confidential data"
    };

    // Type-safe deep encryption
    const encrypted = await client.deepEncrypt(userData);
    console.log('Encryption successful:', encrypted.meta);

    // Type-safe deep decryption
    const decrypted = await client.deepDecrypt(encrypted.encrypted);
    console.log('Decrypted user:', decrypted.data as UserData);

  } catch (error) {
    console.error('TypeScript example failed:', error);
  }
}

typescriptExample();