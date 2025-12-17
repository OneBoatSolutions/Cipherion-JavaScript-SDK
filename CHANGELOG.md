

# Changelog

## [1.1.0] – 2025-12-17

### Added

#### Deep encryption field exclusion

* Added support for **selective field exclusion** during deep encryption using `exclude_fields`.
* Supports **exact path matching** via dot notation (e.g. `profile.id`, `data.metadata.id`).
* Added **path wildcards**:

  * `*` for single-level matching (e.g. `*.id`)
  * `**` for deep recursive matching (e.g. `**.created`)
* Enables keeping non-sensitive structural data (IDs, timestamps, metadata) in plaintext while encrypting sensitive fields.

#### Pattern-based field exclusion

* Added `exclude_patterns` for excluding fields by name patterns at any nesting level.
* Supports glob-style matching:

  * Exact names (e.g. `_id`, `__v`)
  * Prefix patterns (e.g. `timestamp*`)
  * Suffix patterns (e.g. `*_at`)
* Pattern exclusion is applied consistently across objects and arrays.

#### Graceful deep decryption

* Added `fail_gracefully` option to `deepDecrypt`.
* When enabled:

  * Decryption continues even if individual fields fail
  * Corrupted or invalid encrypted values are preserved as-is
  * Operation does not throw on partial failures
* Designed for production environments where partial corruption should not break request handling.

#### Metadata reporting

* Deep encryption now returns structured metadata describing:

  * Total fields processed
  * Billable fields
  * Excluded fields and excluded patterns
* Deep decryption now reports:

  * Failed fields
  * Applied exclusion rules
  * Whether graceful failure handling was enabled
  * Operation context (`deep_encrypt` / `deep_decrypt`)
* Metadata enables auditing, debugging, and billing transparency.

---

### Changed

#### Deep encryption/decryption API surface

* Extended `deepEncrypt` signature to accept an optional configuration object:

  ```ts
  deepEncrypt(data, options?)
  ```
* Extended `deepDecrypt` signature to accept an optional configuration object:

  ```ts
  deepDecrypt(encrypted, options?)
  ```
* Existing usages without options remain fully supported and unchanged.

#### Logging improvements

* Reworked logging format to be **operation-centric**.
* Logs now include:

  * Operation name (`encrypt`, `decrypt`, `deepEncrypt`, `deepDecrypt`)
  * Duration
  * Status
  * Field counts and exclusion statistics where applicable
* Logging remains opt-in and configurable via client options.

---

### Fixed

* Improved handling of nested objects and arrays during deep encryption and decryption.
* Fixed edge cases where fields with identical names at different depths were incorrectly handled.
* Improved stability when processing mixed plaintext and encrypted values.
* Addressed inconsistencies in metadata reporting for complex nested structures.

---

### Backward Compatibility

* No breaking changes introduced.
* All existing method calls without options continue to work exactly as before.
* Default behavior remains unchanged when exclusion options are not provided.

---

### Notes

* Exclusion rules used during encryption should be reused during decryption for consistent results.
* `fail_gracefully` is recommended for production workloads to avoid full-operation failures due to partial data corruption.
* IDs, timestamps, and structural metadata are good candidates for exclusion to improve usability and performance.

