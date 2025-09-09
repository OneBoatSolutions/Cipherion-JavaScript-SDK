# CipherionClient SDK

<div align="center">
  
![npm version](https://img.shields.io/npm/v/cipherion-client.svg?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/cipherion-client.svg?style=flat-square)
![build status](https://img.shields.io/github/workflow/status/yourusername/cipherion-client/CI?style=flat-square)
![coverage](https://img.shields.io/codecov/c/github/OneBoatSolutions/Cipherion-JavaScript-SDK?style=flat-square)
![license](https://img.shields.io/npm/l/cipherion-client.svg?style=flat-square)
![node version](https://img.shields.io/node/v/cipherion-client.svg?style=flat-square)
![typescript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)

**A robust JavaScript/TypeScript SDK for the Cipherion Encryption API**

*Secure • Scalable • Enterprise-Ready*

[Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples) • [Support](#support)

</div>

---

## ✨ Features

- 🔐 **Complete Encryption Suite** - Basic and deep object encryption/decryption
- 🚀 **Enterprise Ready** - Built-in logging, error handling, and retry mechanisms  
- 📦 **Migration Tools** - Batch processing with queue and background worker support
- 🛡️ **Type Safe** - Full TypeScript support with comprehensive type definitions
- 📊 **Compliance Logging** - Structured logging for audit and compliance requirements
- ⚡ **High Performance** - Optimized for large-scale data processing
- 🔧 **Highly Configurable** - Flexible configuration with environment variable support

## 🚀 Quick Start

### Installation

```bash
npm install @cipherion/client
```

### Environment Setup

Create a `.env` file in your project root:

```bash
CIPHERION_BASE_URL=https://api.cipherion.com
CIPHERION_PROJECT_ID=proj_your_project_id
CIPHERION_API_KEY=your_api_key_here
CIPHERION_PASSPHRASE=your_secure_passphrase_here
```

### Basic Usage

```javascript
const { CipherionClient } = require('@cipherion/client');

// Initialize client
const client = new CipherionClient();

async function example() {
  try {
    // Basic string encryption
    const encrypted = await client.encrypt("Hello, World!");
    console.log('Encrypted:', encrypted);
    
    // Basic string decryption
    const decrypted = await client.decrypt(encrypted);
    console.log('Decrypted:', decrypted);
    
    // Deep object encryption
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      ssn: "123-45-6789"
    };
    
    const deepEncrypted = await client.deepEncrypt(userData);
    const deepDecrypted = await client.deepDecrypt(deepEncrypted.encrypted);
    
    console.log('Original:', userData);
    console.log('Decrypted:', deepDecrypted.data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();
```

### TypeScript Usage

```typescript
import { CipherionClient, CipherionConfig } from '@cipherion/client';

interface UserData {
  id: number;
  name: string;
  email: string;
}

const config: CipherionConfig = {
  baseUrl: process.env.CIPHERION_BASE_URL!,
  projectId: process.env.CIPHERION_PROJECT_ID!,
  apiKey: process.env.CIPHERION_API_KEY!,
  passphrase: process.env.CIPHERION_PASSPHRASE!,
  logLevel: 'info'
};

const client = new CipherionClient(config);

const userData: UserData = {
  id: 1,
  name: "Jane Smith", 
  email: "jane@example.com"
};

const result = await client.deepEncrypt(userData);
```

## 📖 API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `encrypt(data)` | Encrypts a string | `Promise<string>` |
| `decrypt(encryptedData)` | Decrypts a string | `Promise<string>` |
| `deepEncrypt(data)` | Encrypts complex objects | `Promise<DeepEncryptResponse>` |
| `deepDecrypt(encryptedData)` | Decrypts complex objects | `Promise<DeepDecryptResponse>` |

### Migration Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `migrateEncrypt(dataArray, options?)` | Batch encrypt array of objects | Large dataset encryption |
| `migrateDecrypt(encryptedArray, options?)` | Batch decrypt array of objects | Large dataset decryption |

### Configuration Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getConfig()` | Get current configuration (safe) | `CipherionConfig` |
| `updateConfig(newConfig)` | Update client configuration | `void` |

## 🔧 Configuration Options

```typescript
interface CipherionConfig {
  baseUrl: string;                    // API base URL
  projectId: string;                  // Your project ID
  apiKey: string;                     // Your API key
  passphrase: string;         // Default passphrase
  timeout?: number;                   // Request timeout (default: 30000ms)
  retries?: number;                   // Max retries (default: 3)
  logLevel?: 'error' | 'warn' | 'info' | 'debug';  // Log level
  enableLogging?: boolean;            // Enable/disable logging
}
```

## 📊 Migration & Batch Processing

Perfect for enterprise scenarios requiring large-scale data processing:

```javascript
const migrationOptions = {
  batchSize: 10,                      // Items per batch
  delayBetweenBatches: 1000,         // Delay in ms
  maxRetries: 3,                      // Retry attempts
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  },
  onError: (error, item) => {
    console.error(`Failed item:`, error.message);
  }
};

// Encrypt large dataset
const result = await client.migrateEncrypt(
  largeDataArray, 
  passphrase, 
  migrationOptions
);

console.log(`Success: ${result.summary.successful}`);
console.log(`Failed: ${result.summary.failed}`);
```

## 🔄 Queue Integration

Built for enterprise queue systems like Bull, Agenda, or cloud-based solutions:

```javascript
const Queue = require('bull');
const { CipherionClient } = require('@cipherion/client');

const encryptionQueue = new Queue('encryption', 'redis://127.0.0.1:6379');
const client = new CipherionClient();

// Process encryption jobs
encryptionQueue.process('encrypt-batch', async (job) => {
  const { data, passphrase } = job.data;
  return await client.deepEncrypt(data, passphrase);
});

// Add jobs to queue
await encryptionQueue.add('encrypt-batch', {
  data: userData,
  passphrase: process.env.CIPHERION_PASSPHRASE
});
```

## 📝 Logging

All operations are logged to `cipherion-logs/` directory for compliance:

```
cipherion-logs/
├── combined.log     # All logs
├── error.log        # Error logs only
```

**Log Structure:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "API Call",
  "method": "POST",
  "endpoint": "/api/v1/crypto/encrypt/proj_123",
  "statusCode": 200,
  "duration": 150
}
```

## ⚡ Performance & Best Practices

### Memory Management
```javascript
// Process large datasets in chunks
async function processLargeDataset(dataArray) {
  const chunkSize = 1000;
  for (let i = 0; i < dataArray.length; i += chunkSize) {
    const chunk = dataArray.slice(i, i + chunkSize);
    await client.migrateEncrypt(chunk);
    
    // Allow garbage collection
    if (i % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### Error Handling
```javascript
async function robustEncryption(data) {
  try {
    return await client.deepEncrypt(data);
  } catch (error) {
    if (error.statusCode === 429) {
      // Rate limit - wait and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await client.deepEncrypt(data);
    }
    throw error;
  }
}
```

### Security Best Practices
- ✅ Use environment variables for credentials
- ✅ Implement proper error handling
- ✅ Monitor API usage and logs
- ✅ Use strong passphrases (minimum 12 characters)
- ✅ Rotate API keys regularly

## 📚 Examples

Explore comprehensive examples in the `/examples` directory:

- **[Basic Usage](./examples/basic-usage.js)** - Simple encryption/decryption
- **[TypeScript Example](./examples/typescript-example.ts)** - Full TypeScript implementation  
- **[Migration Example](./examples/migration-example.js)** - Large-scale data processing
- **[Queue Integration](./examples/queue-example.js)** - Background job processing

## 🛠️ Development

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0

### Setup
```bash
git clone https://github.com/OneBoatSolutions/Cipherion-JavaScript-SDK.git
cd cipherion-client
npm install
```

### Scripts
```bash
npm run build          # Build TypeScript
npm run test           # Run tests
npm run test:watch     # Watch mode testing
npm run lint           # Lint code
npm run format         # Format code
```

## 📈 Supported Platforms

| Platform | Support | Version |
|----------|---------|---------|
| Node.js | ✅ | >= 14.0.0 |
| Browser | ⚠️ | Via bundler only |
| TypeScript | ✅ | >= 4.0.0 |
| ES Modules | ✅ | Native support |
| CommonJS | ✅ | Native support |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

<!-- - 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/cipherion-client/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/yourusername/cipherion-client/discussions)
- 🔧 **Pull Requests**: [Contribution workflow](./CONTRIBUTING.md#pull-request-workflow) -->

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Documentation
- 📖 **[API Documentation](./docs/API.md)** - Complete API reference
- 🔒 **[Security Guide](./SECURITY.md)** - Security best practices
- 📝 **[Changelog](./CHANGELOG.md)** - Release history

### Community
- 💬 **[GitHub Discussions](https://github.com/yourusername/cipherion-client/discussions)** - Community support
- 🐛 **[Issues](https://github.com/yourusername/cipherion-client/issues)** - Bug reports
- 📧 **Email**: support@cipherion.com

### Enterprise Support
For enterprise support, custom implementations, or consulting services, please contact our team.

---

<div align="center">

**Made with ❤️ by the Cipherion Team**

[![GitHub stars](https://img.shields.io/github/stars/OneBoatSolutions/Cipherion-JavaScript-SDK.git?style=social)](https://github.com/OneBoatSolutions/Cipherion-JavaScript-SDK)
[![Twitter Follow](https://img.shields.io/twitter/follow/cipherion?style=social)](https://twitter.com/cipherion)

</div>