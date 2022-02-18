/**
 * Azure Key Vault handler.
 *
 * Eases sets and gets secrets from a
 * shared Azure Key Vault, grouping
 * by project and specific group.
 *
 * @summary Azure Key Vault handler.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 */

import { DefaultAzureCredential } from '@azure/identity';
import { deflatten, flatten } from './flatten.util';
import {
    DeletedSecret,
    KeyVaultSecret,
    SecretClient,
    SecretProperties
} from '@azure/keyvault-secrets';
import {
    AzureKeyVaultConfig,
    AzureKeyVaultCredentials
} from './models/config.interface';
import {
    AzureKeyVaultSecrets,
    SecretKey,
    SecretValue
} from './models/secrets.interface';

/**
 * Azure Key Vault handler.
 */
export class AzureKeyVault {
    /**
     * Azure Key Vault client.
     *
     * @private
     * @type {SecretClient}
     */
    public client: SecretClient;

    /**
     * Secret prefix.
     *
     * @private
     * @type {string}
     */
    private prefix: string;

    /**
     * Shared secret prefix.
     *
     * @private
     * @type {string}
     */
    private prefixShared: string;

    /**
     * Project name.
     *
     * @private
     * @type {string}
     */
    private project: string;

    /**
     * Secrets group.
     *
     * @private
     * @type {string}
     */
    private group?: string;

    /**
     * Secrets environment.
     *
     * @private
     * @type {string}
     */
    private env?: string;

    /**
     * Secrets shared group.
     *
     * @private
     * @type {string}
     */
    private sharedGroup?: string;

    /**
     * Validates emptiness of an object.
     *
     * @constructor
     *
     * @param {AzureKeyVaultConfig} config key vault config
     * @param {object} [credentials] key vault config
     */
    constructor(
        config: AzureKeyVaultConfig,
        credentials?: AzureKeyVaultCredentials,
        client?: SecretClient
    ) {
        if (credentials) {
            const { keyVaultUri, clientId, clientSecret, tenantId } =
                credentials;

            process.env.AZURE_KEY_VAULT_URI = keyVaultUri;
            process.env.AZURE_CLIENT_ID = clientId;
            process.env.AZURE_CLIENT_SECRET = clientSecret;
            process.env.AZURE_TENANT_ID = tenantId;
        }

        const { project, group, env, sharedGroup = 'SHARED' } = config;

        this.project = project;
        this.group = group;
        this.env = env;
        this.sharedGroup = sharedGroup; // for project shared variables

        const nsEnv = env ? `-${env}` : '';
        const nsGroup = group ? `-${group}` : '';

        // calculates secret name prefix for project group
        this.prefix = `${project}${nsGroup}${nsEnv}`;
        this.prefixShared = `${project}${nsEnv}`;
        this.client =
            client ??
            new SecretClient(
                process.env.AZURE_KEY_VAULT_URI ?? '',
                new DefaultAzureCredential()
            );
    }

    /**
     * Retrieves secret name for current project group.
     *
     * @param {SecretKey} key secret key
     * @param {boolean} [isShared] project shared secret (prefixed with $)
     *
     * @returns {string} secret name
     */
    secretName(key: SecretKey, isShared = false): string {
        const prefix = isShared ? this.prefixShared : this.prefix;

        return `${prefix}-${key}`
            .replace(/[_ ]+/g, '-')
            .replace(/:/g, '--')
            .replace(/[$]/g, '')
            .toLowerCase();
    }

    /**
     * Retrieves a single secret value.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.get('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {string} key secret key
     * @param {boolean} serialized whether value is serialized
     *
     * @returns {Promise<string | null>} secret value
     */
    async get(key: SecretKey, serialized = false): Promise<string | null> {
        const isShared = key.includes('$');

        try {
            const {
                value,
                properties: { tags = {} }
            } = await this.client.getSecret(this.secretName(key, isShared));

            const { serialized } = tags;

            return serialized === '1' && value ? JSON.parse(value) : value;
        } catch {
            return null;
        }
    }

    /**
     * Retrieves a single secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.getInfo('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {SecretKey} key secret key
     *
     * @returns {Promise<KeyVaultSecret>} secret
     */
    getInfo(key: SecretKey): Promise<KeyVaultSecret> {
        const isShared = key.includes('$');

        return this.client.getSecret(this.secretName(key, isShared));
    }

    /**
     * Inserts or updates a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.set('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     * [i] not string value will be serialized.
     *
     * @param {SecretKey} key secret key
     * @param {SecretValue} value secret value
     *
     * @returns {Promise<KeyVaultSecret>} secret properties
     */
    set(key: SecretKey, value: SecretValue): Promise<KeyVaultSecret> {
        // extracts name and member path in case of nested prop.
        const sections = key.split(/:|--/);
        const path = sections.slice(0, -1).join('--');
        const name = sections.at(-1) ?? '';

        const isShared = name[0] === '$';
        const shouldBeSerialized = typeof value !== 'string';

        return this.client.setSecret(
            this.secretName(key, isShared),
            shouldBeSerialized ? JSON.stringify(value) : value,
            {
                tags: {
                    name,
                    path,
                    env: this.env ?? '',
                    project: this.project,
                    group: (isShared ? this.sharedGroup : this.group) ?? '',
                    serialized: shouldBeSerialized ? '1' : '0'
                }
            }
        );
    }

    /**
     * Deletes a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  await keyVault.delete('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {SecretKey} key secret key
     *
     * @returns {Promise<DeletedSecret | null>} deletion info
     */
    async delete(key: SecretKey): Promise<DeletedSecret | null> {
        const isShared = key.includes('$');

        try {
            const poller = await this.client.beginDeleteSecret(
                this.secretName(key, isShared)
            );

            return poller.pollUntilDone();
        } catch {
            return null;
        }
    }

    /**
     * Purges a deleted secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  await keyVault.purge('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {SecretKey} key secret key
     *
     * @returns {Promise<void> | null} purge info
     */
    purge(key: SecretKey): Promise<void> | null {
        const isShared = key.includes('$');

        try {
            return this.client.purgeDeletedSecret(
                this.secretName(key, isShared)
            );
        } catch {
            return null;
        }
    }

    /**
     * Restores a deleted secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  await keyVault.restore('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {SecretKey} key secret key
     *
     * @returns {Promise<any>} restoration info
     */
    async restore(key: SecretKey): Promise<SecretProperties | null> {
        const isShared = key.includes('$');

        try {
            const recover = await this.client.beginRecoverDeletedSecret(
                this.secretName(key, isShared)
            );

            return recover.pollUntilDone();
        } catch {
            return null;
        }
    }

    /**
     * Retrieves all secrets for the project group.
     *
     * [i] iterates over every secret in key vault,
     * so this function may be slow. Prefer getFor().
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @returns {Promise<Array<any>>} project group secrets list
     */
    async getAll(): Promise<AzureKeyVaultSecrets> {
        const secrets: AzureKeyVaultSecrets = {};

        for await (const { tags } of this.client.listPropertiesOfSecrets()) {
            const { project, env, group, name, path, serialized } = tags ?? {};

            const key = (path ? `${path}--` : '') + name;
            const isShared = group === this.sharedGroup;
            const isSerialized = !!+serialized;

            if (
                project === this.project &&
                env === this.env &&
                (isShared || group === this.group)
            )
                secrets[key] = await this.get(key, isSerialized);
        }

        return deflatten(secrets);
    }

    /**
     * Retrieves secrets for the project group defined in secrets input.
     * Value for input secret will be replaced if Kev Vault has it.
     *
     * [i] in order to get array correctly deserialized,
     *  use [] as default value instead of null or undefined.
     *
     * [i] about 4 times faster than getAll()
     *
     * @param {AzureKeyVaultSecrets} secrets object with secrets (key, value)
     * @param {boolean} override if override secrets with default value
     *
     * @returns {Promise<AzureKeyVaultSecrets>} project group secrets list
     */
    async getFor(
        secrets: AzureKeyVaultSecrets,
        override = false
    ): Promise<AzureKeyVaultSecrets> {
        const promises: Record<SecretKey, Promise<SecretValue>> = {};

        // multi level nested json support.
        secrets = flatten(secrets);

        // executes request
        for (const key in secrets) {
            const secret = secrets[key];
            const isArray = Array.isArray(secret);

            if (override) promises[key] = this.get(key, isArray);
            else if (!secret || (isArray && secret?.length === 0))
                promises[key] = this.get(key, Array.isArray(secret));
            else promises[key] = Promise.resolve(secret);
        }

        for (const key in secrets) {
            try {
                // waits for secret retrieving
                const value = await promises[key];

                secrets[key] = value ?? secrets[key];
            } catch {
                continue;
            }
        }

        return deflatten(secrets);
    }

    /**
     * Insert or updates many secrets.
     *
     * @param {AzureKeyVaultSecrets} secrets dictionary with secrets (key, value)
     *
     * @returns {Promise<KeyVaultSecret[]>} secrets properties
     */
    async setAll(secrets: AzureKeyVaultSecrets): Promise<KeyVaultSecret[]> {
        const results = [];

        // multi level nested json support.
        secrets = flatten(secrets);

        for (const key in secrets)
            results.push(await this.set(key, secrets[key]));

        return results;
    }

    /**
     * Deletes every secrets for the project group.
     *
     * @param {boolean} [skipShared] skips shared vars
     *
     * @returns {Promise<void>}
     */
    async deleteAll(skipShared = true): Promise<void> {
        for await (const { tags } of this.client.listPropertiesOfSecrets()) {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (
                project === this.project &&
                env === this.env &&
                (isShared || group === this.group)
            )
                await this.delete(key);
        }
    }

    /**
     * Purges every deleted secrets for the project group.
     *
     * @param {boolean} [skipShared] skips shared vars
     *
     * @returns {Promise<void>}
     */
    async purgeAll(skipShared = true): Promise<void> {
        for await (const {
            properties: { tags }
        } of this.client.listDeletedSecrets()) {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (
                project === this.project &&
                env === this.env &&
                (isShared || group === this.group)
            )
                await this.purge(key);
        }
    }

    /**
     * Restores every deleted secrets for the project group.
     *
     * @param {boolean} [skipShared] skips shared vars
     *
     * @returns {Promise<void>}
     */
    async restoreAll(skipShared = true): Promise<void> {
        for await (const {
            properties: { tags }
        } of this.client.listDeletedSecrets()) {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (
                project === this.project &&
                env === this.env &&
                (isShared || group === this.group)
            )
                await this.restore(key);
        }
    }
}
