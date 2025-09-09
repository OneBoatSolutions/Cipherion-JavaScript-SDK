import { CipherionClient } from '../../src/client/CipherionClient';
import { CipherionError } from '../../src/errors/CipherionError';

describe('CipherionClient', () => {
  let client: CipherionClient;

  beforeEach(() => {
    client = new CipherionClient({
      baseUrl: '',
      projectId: 'test-project',
      apiKey: 'test-key',
      defaultPassphrase: 'test-passphrase-123',
      enableLogging: false,
    });
  });

  describe('Configuration', () => {
    it('should throw error for missing required config', () => {
      expect(() => {
        new CipherionClient({
          baseUrl: '',
          projectId: 'test',
          apiKey: 'test',
        });
      }).toThrow(CipherionError);
    });

    it('should load config from environment variables', () => {
      process.env.CIPHERION_BASE_URL = '';
      process.env.CIPHERION_PROJECT_ID = 'env-project';
      process.env.CIPHERION_API_KEY = 'env-key';

      const envClient = new CipherionClient();
      const config = envClient.getConfig();

      expect(config.baseUrl).toBe('');
      expect(config.projectId).toBe('env-project');
    });
  });

  describe('Validation', () => {
    it('should validate passphrase length', async () => {
      await expect(client.encrypt('test', 'short')).rejects.toThrow(CipherionError);
    });

    it('should validate data is not null', async () => {
      await expect(client.encrypt(null as any)).rejects.toThrow(CipherionError);
    });
  });
});