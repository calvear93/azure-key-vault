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

const BACKUP_PREFIX = '___backup___';

const DELETED_PREFIX = '___deleted___';

export class AkvClientMock implements Partial<SecretClient> {
    vaultUrl: string;

    secrets: Record<string, KeyVaultSecret>;

    private readonly encoder: TextEncoder;

    private readonly decoder: TextDecoder;

    async *[Symbol.asyncIterator]() {
        const secrets = Object.values(this.secrets);

        for (const secret of secrets) yield secret;
    }

    constructor(vaultUrl?: string) {
        this.vaultUrl = vaultUrl ?? 'localhost';
        GLOBAL_STORE[this.vaultUrl] = GLOBAL_STORE[this.vaultUrl] ?? {};
        this.secrets = GLOBAL_STORE[this.vaultUrl];
        // backup utils
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
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

        const deletedName = `${DELETED_PREFIX}${name}`;

        this.secrets[deletedName] = this.secrets[name];
        delete this.secrets[name];

        return Promise.resolve({
            pollUntilDone: () => Promise.resolve(this.secrets[deletedName])
        } as any);
    }

    updateSecretProperties(
        secretName: string,
        secretVersion: string,
        { enabled, expiresOn, tags }: UpdateSecretPropertiesOptions
    ): Promise<SecretProperties> {
        if (!this.secrets[secretName])
            throw new Error('Secret does not exists');

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
        const deletedName = `${DELETED_PREFIX}${secretName}`;

        if (!this.secrets[deletedName])
            throw new Error('Secret does not exists');

        return Promise.resolve(this.secrets[deletedName]);
    }

    purgeDeletedSecret(
        secretName: string,
        options?: PurgeDeletedSecretOptions
    ): Promise<void> {
        const deletedName = `${DELETED_PREFIX}${secretName}`;

        if (!this.secrets[deletedName])
            throw new Error('Deleted secret does not exists');

        delete this.secrets[deletedName];

        return Promise.resolve();
    }

    beginRecoverDeletedSecret(
        name: string,
        options?: BeginRecoverDeletedSecretOptions
    ): Promise<
        PollerLike<PollOperationState<SecretProperties>, SecretProperties>
    > {
        const deletedName = `${DELETED_PREFIX}${name}`;

        if (this.secrets[name] || !this.secrets[deletedName])
            throw new Error('Secret is not deleted');

        this.secrets[name] = this.secrets[deletedName];
        delete this.secrets[deletedName];

        return Promise.resolve({
            pollUntilDone: () => Promise.resolve(this.secrets[name])
        } as any);
    }

    backupSecret(
        secretName: string,
        options?: BackupSecretOptions
    ): Promise<Uint8Array | undefined> {
        const backupName = `${BACKUP_PREFIX}${secretName}`;

        this.secrets[backupName] = this.secrets[secretName];

        return Promise.resolve(this.encoder.encode(backupName));
    }

    restoreSecretBackup(
        secretBundleBackup: Uint8Array,
        options?: RestoreSecretBackupOptions
    ): Promise<SecretProperties> {
        const backupName = this.decoder.decode(secretBundleBackup);
        const key = backupName.replace(BACKUP_PREFIX, '');

        this.secrets[key] = this.secrets[backupName];

        return Promise.resolve(this.secrets[key].properties);
    }

    listPropertiesOfSecrets(
        options?: ListPropertiesOfSecretsOptions
    ): PagedAsyncIterableIterator<
        SecretProperties,
        SecretProperties[],
        PageSettings
    > {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const container = this;

        return {
            async *[Symbol.asyncIterator]() {
                const secrets = Object.values(container.secrets);

                for (const { properties } of secrets) yield properties;
            }
        } as any;
    }

    listDeletedSecrets(
        options?: ListDeletedSecretsOptions
    ): PagedAsyncIterableIterator<
        DeletedSecret,
        DeletedSecret[],
        PageSettings
    > {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const container = this;

        return {
            async *[Symbol.asyncIterator]() {
                const keys = Object.keys(container.secrets);

                for (const key of keys) {
                    if (key.startsWith(DELETED_PREFIX))
                        yield container.secrets[key];
                }
            }
        } as any;
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
}
