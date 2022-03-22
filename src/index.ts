export { AzureKeyVault } from './azure-key-vault.service';
export { AkvClientMock } from './__mocks__/akv-client.mock';
export type {
    AzureKeyVaultSecrets,
    SecretKey,
    SecretValue
} from './models/secrets.interface';
export type {
    AzureKeyVaultConfig,
    AzureKeyVaultCredentials
} from './models/config.interface';
