/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    BackupSecretOptions,
    BeginDeleteSecretOptions,
    BeginRecoverDeletedSecretOptions,
    DeletedSecret,
    GetDeletedSecretOptions,
    GetSecretOptions,
    KeyVaultSecret,
    ListDeletedSecretsOptions,
    ListPropertiesOfSecretsOptions,
    ListPropertiesOfSecretVersionsOptions,
    PagedAsyncIterableIterator,
    PageSettings,
    PollerLike,
    PollOperationState,
    PurgeDeletedSecretOptions,
    RestoreSecretBackupOptions,
    SecretClient,
    SecretProperties,
    SetSecretOptions,
    UpdateSecretPropertiesOptions
} from '@azure/keyvault-secrets';

// represents azure key vault stores server
const GLOBAL_STORE: Record<string, Record<string, KeyVaultSecret>> = {};

// clears specific key vault store
export const clearStore = (vaultUrl: string) => {
    delete GLOBAL_STORE[vaultUrl];
};

export class AkvClientMock implements SecretClient {
    vaultUrl: string;

    private readonly secrets: Record<string, KeyVaultSecret>;

    *[Symbol.asyncIterator]() {
        const secrets = Object.values(this.secrets);

        for (const secret of secrets) yield Promise.resolve(secret);
    }

    constructor(vaultUrl?: string) {
        this.vaultUrl = vaultUrl ?? 'localhost';
        GLOBAL_STORE[this.vaultUrl] = GLOBAL_STORE[this.vaultUrl] ?? {};
        this.secrets = GLOBAL_STORE[this.vaultUrl];
    }

    setSecret(
        secretName: string,
        value: string,
        { enabled, expiresOn, tags }: SetSecretOptions
    ): Promise<KeyVaultSecret> {
        this.secrets[secretName] = {
            name: secretName,
            value,
            properties: {
                vaultUrl: this.vaultUrl,
                version: '1',
                name: secretName,
                enabled: enabled ?? true,
                createdOn: new Date(),
                updatedOn: new Date(),
                expiresOn,
                tags
            }
        };

        return Promise.resolve(this.secrets[secretName]);
    }

    beginDeleteSecret(
        name: string,
        options?: BeginDeleteSecretOptions
    ): Promise<PollerLike<PollOperationState<DeletedSecret>, DeletedSecret>> {
        if (!this.secrets[name]) throw new Error('Secret does not exists');

        const deleted = this.secrets[name] as DeletedSecret;
        delete this.secrets[name];

        return Promise.resolve({
            pollUntilDone: () => Promise.resolve(deleted)
        } as any);
    }

    updateSecretProperties(
        secretName: string,
        secretVersion: string,
        { enabled, expiresOn, tags }: UpdateSecretPropertiesOptions
    ): Promise<SecretProperties> {
        const secret = this.secrets[secretName];

        this.secrets[secretName] = {
            ...secret,
            properties: {
                ...secret.properties,
                version: secretVersion ?? '1',
                updatedOn: new Date(),
                expiresOn: expiresOn ?? secret.properties.expiresOn,
                enabled: enabled ?? true,
                tags
            }
        };

        return Promise.resolve(this.secrets[secretName].properties);
    }

    getSecret(
        secretName: string,
        options?: GetSecretOptions
    ): Promise<KeyVaultSecret> {
        if (!this.secrets[secretName])
            throw new Error('Secret does not exists');

        return Promise.resolve(this.secrets[secretName]);
    }

    getDeletedSecret(
        secretName: string,
        options?: GetDeletedSecretOptions
    ): Promise<DeletedSecret> {
        throw new Error('Method not implemented.');
    }

    purgeDeletedSecret(
        secretName: string,
        options?: PurgeDeletedSecretOptions
    ): Promise<void> {
        throw new Error('Method not implemented.');
    }

    beginRecoverDeletedSecret(
        name: string,
        options?: BeginRecoverDeletedSecretOptions
    ): Promise<
        PollerLike<PollOperationState<SecretProperties>, SecretProperties>
    > {
        throw new Error('Method not implemented.');
    }

    backupSecret(
        secretName: string,
        options?: BackupSecretOptions
    ): Promise<Uint8Array | undefined> {
        throw new Error('Method not implemented.');
    }

    restoreSecretBackup(
        secretBundleBackup: Uint8Array,
        options?: RestoreSecretBackupOptions
    ): Promise<SecretProperties> {
        throw new Error('Method not implemented.');
    }

    listPropertiesOfSecretVersions(
        secretName: string,
        options?: ListPropertiesOfSecretVersionsOptions
    ): PagedAsyncIterableIterator<
        SecretProperties,
        SecretProperties[],
        PageSettings
    > {
        throw new Error('Method not implemented.');
    }

    listPropertiesOfSecrets(
        options?: ListPropertiesOfSecretsOptions
    ): PagedAsyncIterableIterator<
        SecretProperties,
        SecretProperties[],
        PageSettings
    > {
        return this[Symbol.asyncIterator] as any;
    }

    listDeletedSecrets(
        options?: ListDeletedSecretsOptions
    ): PagedAsyncIterableIterator<
        DeletedSecret,
        DeletedSecret[],
        PageSettings
    > {
        throw new Error('Method not implemented.');
    }
}
