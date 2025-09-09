const { CipherionClient } = require('@cipherion/client');

async function basicExample() {
  const client = new CipherionClient({
    baseUrl: process.env.CIPHERION_BASE_URL,
    projectId: process.env.CIPHERION_PROJECT_ID,
    apiKey: process.env.CIPHERION_API_KEY,
    passphrase: process.env.CIPHERION_PASSPHRASE,
  });

  try {
    // Basic string encryption
    const plaintext = "Hello, World!";
    const encrypted = await client.encrypt(plaintext);
    console.log('Encrypted:', encrypted);

    // Basic string decryption
    const decrypted = await client.decrypt(encrypted);
    console.log('Decrypted:', decrypted);

    // Deep object encryption
    const userData = {
      user: {
        name: "John Doe",
        email: "john@example.com",
        ssn: "123-45-6789"
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0"
      }
    };

    const deepEncrypted = await client.deepEncrypt(userData);
    console.log('Deep Encrypted:', deepEncrypted.encrypted);

    // Deep object decryption
    const deepDecrypted = await client.deepDecrypt(deepEncrypted.encrypted);
    console.log('Deep Decrypted:', deepDecrypted.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

basicExample();