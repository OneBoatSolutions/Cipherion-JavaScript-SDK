const { CipherionClient } = require('cipherion-client');
const Queue = require('bull'); // Example with Bull queue

async function migrationExample() {
  const client = new CipherionClient();
  
  // Sample data array
  const userData = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
    // ... more data
  ];

  const migrationOptions = {
    batchSize: 5,
    delayBetweenBatches: 2000,
    maxRetries: 3,
    onProgress: (progress) => {
      console.log(`Migration Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`);
    },
    onError: (error, item) => {
      console.error(`Failed to process item ${item.id}:`, error.message);
    },
  };

  try {
    console.log('Starting encryption migration...');
    const encryptResult = await client.migrateEncrypt(userData, undefined, migrationOptions);
    
    console.log('Encryption Migration Results:');
    console.log(`- Successful: ${encryptResult.summary.successful}`);
    console.log(`- Failed: ${encryptResult.summary.failed}`);
    
    // Store encrypted data (e.g., in database)
    const encryptedData = encryptResult.successful.map(result => result.encrypted);
    
    console.log('Starting decryption migration...');
    const decryptResult = await client.migrateDecrypt(encryptedData, undefined, migrationOptions);
    
    console.log('Decryption Migration Results:');
    console.log(`- Successful: ${decryptResult.summary.successful}`);
    console.log(`- Failed: ${decryptResult.summary.failed}`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

// Example with Bull queue for background processing
async function queueBasedMigration() {
  const encryptionQueue = new Queue('encryption queue', 'redis://127.0.0.1:6379');
  const client = new CipherionClient();

  // Define job processor
  encryptionQueue.process('encrypt-data', async (job) => {
    const { data, passphrase } = job.data;
    try {
      const result = await client.deepEncrypt(data, passphrase);
      return result;
    } catch (error) {
      throw error;
    }
  });

  // Add jobs to queue
  const userData = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];

  for (const user of userData) {
    await encryptionQueue.add('encrypt-data', {
      data: user,
      passphrase: process.env.CIPHERION_PASSPHRASE,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  console.log('Jobs added to queue for background processing');
}

migrationExample();