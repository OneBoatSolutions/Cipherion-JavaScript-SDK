# Deep Encryption & Decryption with Field Exclusion

This document explains the **new deep encryption and decryption capabilities** introduced in the SDK, focusing on **field exclusion**, **pattern matching**, and **graceful failure handling**. It is intended to help developers understand *why* these features exist, *when* to use them, and *how* to apply them correctly.

---

## Why This Feature Exists

In real-world applications, not all data should be encrypted.

Examples:

* Database identifiers (`id`, `_id`, `__v`)
* Timestamps used for sorting and filtering
* Metadata required for application logic

Encrypting everything often causes friction:

* Harder querying and indexing
* Breaks integrations that expect plaintext IDs
* Failures when partially corrupted data exists

This feature allows **selective encryption** while preserving application stability and data usability.

---

## Core Concepts

### 1. Selective Field Encryption

You can now choose **exact fields** or **groups of fields** to remain in plaintext while encrypting everything else.

### 2. Pattern-Based Exclusion

Instead of listing every field explicitly, patterns allow excluding entire classes of fields (for example, all `_id` or timestamp fields).

### 3. Graceful Decryption

During decryption, corrupted or invalid encrypted fields no longer need to crash the entire operation. Instead, they can be preserved as-is and reported.

### 4. Metadata Transparency

Every deep encryption or decryption operation returns metadata explaining:

* What was excluded
* What failed
* What was processed

This enables auditing, debugging, and billing clarity.

---

## API Overview

### Deep Encrypt

```ts
await client.deepEncrypt(data, {
  exclude_fields?: string[]
  exclude_patterns?: string[]
})
```

### Deep Decrypt

```ts
await client.deepDecrypt(encrypted, {
  exclude_fields?: string[]
  exclude_patterns?: string[]
  fail_gracefully?: boolean
})
```

All options are optional. Existing behavior remains unchanged if no options are provided.

---

## Field Exclusion Strategies

### Excluding Exact Paths (`exclude_fields`)

Use dot notation to exclude specific nested fields.

```ts
exclude_fields: [
  "profile.id",
  "metadata.internal.key"
]
```

This is useful when:

* Field names repeat at multiple levels
* Only one specific instance should remain plaintext

---

### Using Path Wildcards

```ts
exclude_fields: [
  "*.id",        // id at one level
  "**.created"  // created at any depth
]
```

Wildcard rules:

* `*` matches a single path segment
* `**` matches any depth

---

### Pattern-Based Exclusion (`exclude_patterns`)

Patterns match **field names**, regardless of location.

```ts
exclude_patterns: [
  "_id",
  "__v",
  "*_at",
  "timestamp*"
]
```

Examples:

* `_id` → matches all `_id` fields
* `*_at` → matches `created_at`, `updated_at`
* `timestamp*` → matches `timestamp`, `timestamp_ms`

---

## Common Use Cases

### Use Case 1: Database Records

**Problem**: Encrypt user data without breaking database queries.

```ts
await client.deepEncrypt(user, {
  exclude_patterns: ["_id", "__v"],
  exclude_fields: ["profile.id"]
})
```

Result:

* IDs remain queryable
* Sensitive fields are encrypted

---

### Use Case 2: Logs and Analytics Data

**Problem**: Encrypt PII but keep timestamps usable.

```ts
exclude_patterns: ["timestamp", "*_at"]
```

Result:

* Timestamps stay readable
* User content is protected

---

### Use Case 3: Nested Objects with Repeating Keys

```ts
exclude_fields: [
  "id",
  "data.metadata.id"
]
```

This ensures only specific `id` fields remain plaintext.

---

## Graceful Decryption

### What Is Graceful Decryption?

When `fail_gracefully` is enabled, decryption:

* Continues even if some fields are corrupted
* Preserves invalid encrypted values
* Reports failures instead of throwing

```ts
await client.deepDecrypt(encryptedData, {
  fail_gracefully: true
})
```

---

### Example: Corrupted Data Handling

```json
{
  "email": "corrupted_value",
  "name": "valid_encrypted_data"
}
```

Result:

* `name` is decrypted
* `email` remains unchanged
* Failure is recorded in metadata

---

## Metadata Returned

### Encryption Metadata

```json
{
  "totalFields": 10,
  "billableFields": 8,
  "excluded_fields": ["profile.id"],
  "excluded_patterns": ["_id"]
}
```

### Decryption Metadata

```json
{
  "failed_fields": ["email"],
  "fail_gracefully": true,
  "operation": "deep_decrypt"
}
```

Use metadata to:

* Detect partial failures
* Audit encryption behavior
* Debug complex payloads

---

## Best Practices

1. Exclude database identifiers by default
2. Keep timestamps plaintext unless sensitive
3. Reuse the same exclusion rules for encryption and decryption
4. Enable `fail_gracefully` in production
5. Inspect metadata in logs or monitoring

---

## Migration Guidance

If you already have encrypted data:

1. Decrypt existing records without exclusions
2. Re-encrypt using exclusion rules
3. Store exclusion rules alongside data if needed
4. Apply the same rules during decryption

---

## Summary

This feature enables:

* Practical encryption without breaking systems
* Safer handling of corrupted or mixed data
* Fine-grained control over sensitive information

It is designed for **real production workloads**, not idealized examples.
