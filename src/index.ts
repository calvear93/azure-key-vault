export { AzureKeyVault } from './azure-key-vault.service';
export { createAzureKeyVaultMock } from './__mocks__/akv-client.mock';
export type {
    AzureKeyVaultSecrets,
    SecretKey,
    SecretValue
} from './models/secrets.interface';
export type {
    AzureKeyVaultConfig,
    AzureKeyVaultCredentials
} from './models/config.interface';
