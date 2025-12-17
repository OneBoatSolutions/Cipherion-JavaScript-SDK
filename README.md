
# CipherionClient SDK

<div align="center">
  
![npm version](https://img.shields.io/npm/v/@cipherion/client?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/@cipherion/client?style=flat-square)
![license](https://img.shields.io/npm/l/@cipherion/client?style=flat-square)
![node version](https://img.shields.io/node/v/@cipherion/client?style=flat-square)
![typescript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)

**A robust JavaScript/TypeScript SDK for the Cipherion Encryption API**



[Installation](#installation) • [Quick Start](#quick-start) • [Advanced Usage](#advanced-usage-selective-encryption) • [API Reference](#-api-reference) • [Support](#-support)

</div>

---

## ✨ Features

- 🔐 **Complete Encryption Suite** - Basic strings and structure-preserving object encryption.
- 🎯 **Selective Encryption** - Granular control to exclude specific fields or patterns (e.g., IDs, timestamps) from encryption.
- 🛡️ **Resilient Processing** - Graceful failure modes to handle partial data corruption without crashing.
- 🚀 **Enterprise Ready** - Built-in logging, error handling, and exponential backoff retry mechanisms.
- 📦 **Migration Tools** - Batch processing helpers for migrating large datasets.
- 📊 **Compliance Logging** - Redacted, operation-centric logs for audit requirements.
- ⚡ **High Performance** - Optimized for large-scale data processing with configurable batching.

## 🚀 Quick Start

### Installation

```bash
npm install @cipherion/client
```

### Environment Setup

Create a `.env` file in your project root:

```bash
CIPHERION_BASE_URL=https://api.cipherion.in
CIPHERION_PROJECT_ID=proj_your_project_id
CIPHERION_API_KEY=your_api_key_here
CIPHERION_PASSPHRASE=your_secure_passphrase_here

```

### Basic Usage

```javascript
import { CipherionClient } from "@cipherion/client";

// Initialize client
const client = new CipherionClient();

async function example() {
  try {
    // 1. single string encryption
    const encrypted = await client.encrypt("Hello, World!");
    console.log('Encrypted:', encrypted);
    
    // 2. encrypted  string decryption
    const decrypted = await client.decrypt(encrypted);
    console.log('Decrypted:', decrypted);
    
    // 3. Deep object encryption
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      ssn: "123-45-6789"
    };
    
    const deepEncrypted = await client.deepEncrypt(userData);
    const deepDecrypted = await client.deepDecrypt(deepEncrypted.data);
    
    console.log('Original:', userData);
    console.log('Decrypted:', deepDecrypted.data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

example();

```

## 🧠 Advanced Usage: Selective Encryption

New in v1.1.0, you can exclude specific fields from encryption. This is critical for keeping database IDs (`_id`, `id`) and timestamps searchable while protecting PII.

### 1. Excluding Fields & Patterns

```typescript
const user = {
  id: 101,                    // Should stay plain
  username: "bond_james",     // Should be encrypted
  meta: {
    login_ip: "192.168.1.1",  // Should stay plain (pattern match)
    session_id: "sess_99"     // Should be encrypted
  },
  created_at: "2025-01-01"    // Should stay plain (pattern match)
};

const result = await client.deepEncrypt(user, {
  // Exclude specific paths (dot notation supported)
  exclude_fields: ["id", "profile.id"],
  
  // Exclude by pattern (wildcards supported)
  // Matches "created_at", "updated_at", "login_ip", etc.
  exclude_patterns: ["*_at", "*_ip", "_id", "__v"] 
});

console.log(result.data.encrypted); 
// 'id', 'created_at', and 'login_ip' remain visible plaintext.
// 'username' and 'session_id' become encrypted strings.

```

### 2. Graceful Decryption

In production, data might occasionally get corrupted or mixed with legacy plaintext. Use `fail_gracefully` to decrypt valid fields while preserving invalid ones instead of throwing an error.

```typescript
const result = await client.deepDecrypt(encryptedData, {
  // If a field fails decryption, return the original value instead of crashing
  fail_gracefully: true 
});

// Check metadata to see if anything failed silently
if (result.meta.decryptionMetadata.failed_fields.length > 0) {
  console.warn("Partial decryption occurred:", result.meta.decryptionMetadata.failed_fields);
}

```

## 📖 API Reference

### Core Methods

| Method | Description | Returns |
| --- | --- | --- |
| `encrypt(data)` | Encrypts a simple string. | `Promise<string>` |
| `decrypt(encryptedData)` | Decrypts a simple string. | `Promise<string>` |
| `deepEncrypt(data, options?)` | Encrypts objects/arrays with optional exclusions. | `Promise<DeepEncryptResponse>` |
| `deepDecrypt(encryptedData, options?)` | Decrypts objects/arrays with optional graceful handling. | `Promise<DeepDecryptResponse>` |

### Migration Methods

| Method | Description | Use Case |
| --- | --- | --- |
| `migrateEncrypt(dataArray, options?)` | Batch encrypt array of objects. | Database migrations |
| `migrateDecrypt(encryptedArray, options?)` | Batch decrypt array of objects. | Data recovery/export |

### Options Interface

```typescript
interface DeepEncryptOptions {
  exclude_fields?: string[];    // Exact paths: ['id', 'user.id']
  exclude_patterns?: string[];  // Patterns: ['*_at', '_*']
}

interface DeepDecryptOptions {
  exclude_fields?: string[];
  exclude_patterns?: string[];
  fail_gracefully?: boolean;    // Default: false
}

```

## 📊 Migration & Batch Processing

Perfect for enterprise scenarios requiring large-scale data processing. Includes automatic retries and rate limiting.

```javascript
const migrationOptions = {
  batchSize: 50,           // Items processed per API call (1-100)
  delayBetweenBatches: 500, // Ms to wait between batches
  maxRetries: 3,           // Retry failed requests
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`);
  }
};

const result = await client.migrateEncrypt(largeDataArray, migrationOptions);

console.log(`Success: ${result.summary.successful}`);
console.log(`Failed: ${result.summary.failed}`);

```

## 📝 Logging

The SDK auto-generates structured, redacted logs in the `cipherion-logs/` directory. Sensitive data (keys, payloads) is **never** logged.

**File Structure:**

```
cipherion-logs/
├── combined.log     # All operations
├── error.log        # Failures only

```

**Log Format:**

```text
2025-12-17 14:30:00 [info]: operation=deepEncrypt | status=success | dataType=object | totalFields=15 | excludedFields=2 | durationMs=120 | statusCode=200
2025-12-17 14:35:00 [error]: operation=decrypt | status=error | dataType=string | statusCode=400 | error="Invalid passphrase"

```

## 🛡️ Security Best Practices

1. **Credential Locking:** The SDK prevents updating `apiKey` or `passphrase` after initialization.
2. **Environment Variables:** Always use `.env` files; never hardcode secrets.
3. **Partial Encryption:** Use `exclude_fields` for IDs to maintain database indexing performance.
4. **Error Handling:** Use `fail_gracefully` in read-heavy production paths to prevent UI crashes.

## 🛠️ Development

### Prerequisites

* Node.js >= 14.0.0
* npm >= 6.0.0




### Scripts

```bash
npm run build          # Build TypeScript
npm run test           # Run tests
npm run lint           # Lint code

```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://www.google.com/search?q=./CONTRIBUTING.md) for details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=./LICENSE) file for details.

## 🆘 Support

### Documentation

* 📖 **[API Documentation](https://www.google.com/search?q=./docs/API.md)** - Complete API reference
* 🔒 **[Security Guide](https://www.google.com/search?q=./SECURITY.md)** - Security best practices
* 📝 **[Changelog](https://www.google.com/search?q=./CHANGELOG.md)** - Release history

### Community

* 🐛 **[Issues](https://www.google.com/search?q=https://github.com/OneBoatSolutions/Cipherion-JavaScript-SDK/issues)** - Bug reports
* 📧 **Email**: support@cipherion.com

---

<div align="center">

**Made with ❤️ by the Cipherion Team**

</div>
