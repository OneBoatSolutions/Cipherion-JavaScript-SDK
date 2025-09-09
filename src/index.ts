// src/index.ts
export { CipherionClient } from './client/CipherionClient';
export { CipherionError } from './errors/CipherionError';
export * from './types/api';
export * from './types/client';

// Default export for convenience
import { CipherionClient } from './client/CipherionClient';
export default CipherionClient;