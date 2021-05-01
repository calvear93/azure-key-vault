/**
 * Azure Key Vault handler.
 *
 * Eases sets and gets secrets from a
 * shared Azure Key Vault, grouping
 * by project and specific group.
 *
 * @summary Azure Key Vault handler.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2021-03-12 18:06:29
 * Last modified  : 2021-05-01 17:09:09
 */

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { flatten, deflatten } from './flatten.util';

/**
 * Azure Key Vault handler.
 */
export default class AzureKeyVault
{
    /**
     * Validates emptiness of an object.
     *
     * @constructor
     *
     * @param {object} config key vault config
     * @param {string} config.project variables project
     * @param {string} config.group variables group
     * @param {string} config.env environment
     * @param {object} [credentials] key vault config
     * @param {string} credentials.keyVaultUri azure key vault uri
     * @param {string} credentials.clientId service principal name id
     * @param {string} credentials.clientSecret service principal name secret password
     * @param {string} credentials.tenantId tenant id
     */
    constructor(config, credentials)
    {
        if (credentials)
        {
            const { keyVaultUri, clientId, clientSecret, tenantId } = credentials;

            process.env.AZURE_KEY_VAULT_URI = keyVaultUri;
            process.env.AZURE_CLIENT_ID = clientId;
            process.env.AZURE_CLIENT_SECRET = clientSecret;
            process.env.AZURE_TENANT_ID = tenantId;
        }

        const { project, group, env } = config;

        this.project = project;
        this.group = group;
        this.env = env;
        // calculates secret name prefix for project group
        this.prefix = `${project}${group ? `-${group}` : ''}${env ? `-${env}` : ''}`;
        this.client = new SecretClient(process.env.AZURE_KEY_VAULT_URI ?? '', new DefaultAzureCredential());
    }

    /**
     * Retrieves secret name for current project group.
     *
     * @param {string} key secret key
     * @returns {string} secret name
     */
    secretName(key)
    {
        return `${this.prefix}-${key}`
            .replace(/[_ ]+/g, '-')
            .replace(/:/g, '--')
            .toLowerCase();
    }

    /**
     * Retrieves a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.get('car:name');
     *
     * @param {string} key secret key
     * @param {bool} serialized whether value is serialized
     *
     * @returns {any | string | null} secret
     */
    async get(key, serialized = false)
    {
        try
        {
            const { value } = await this.client.getSecret(this.secretName(key));

            return serialized ? JSON.parse(value) : value;
        }
        catch
        {
            return null;
        }
    }

    /**
     * Retrieves a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.getInfo('car:name');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} secret
     */
    getInfo(key)
    {
        return this.client.getSecret(this.secretName(key));
    }

    /**
     * Inserts or updates a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.set('car:name');
     * [i] not string value will be serialized.
     *
     * @param {string} key secret key
     * @param {string | any} value secret value
     *
     * @returns {Promise<any>} secret properties
     */
    set(key, value)
    {
        // extracts name and member path in case of nested prop.
        const [ name, ...path ] = key.split(':').reverse();

        const shouldBeSerialized = typeof value !== 'string';

        return this.client.setSecret(
            this.secretName(key),
            shouldBeSerialized ? JSON.stringify(value) : value,
            {
                tags: {
                    name,
                    path: path.reverse().join(':'),
                    env: this.env,
                    project: this.project,
                    group: this.group,
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
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} deletion info
     */
    async delete(key)
    {
        try
        {
            const poller = await this.client.beginDeleteSecret(this.secretName(key));

            return await poller.pollUntilDone();
        }
        catch
        {
            return Promise.resolve({ message: `secret ${key} does not exists` });
        }
    }

    /**
     * Purges a deleted secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  await keyVault.purge('car:name');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} purge info
     */
    purge(key)
    {
        try
        {
            return this.client.purgeDeletedSecret(this.secretName(key));
        }
        catch
        {
            return Promise.resolve({ message: `secret ${key} does not exists` });
        }
    }

    /**
     * Restores a deleted secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  await keyVault.restore('car:name');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} restoration info
     */
    async restore(key)
    {
        try
        {
            const recover = await this.client.beginRecoverDeletedSecret(this.secretName(key));

            return await recover.pollUntilDone();
        }
        catch
        {
            return Promise.resolve({ message: `secret ${key} does not exists` });
        }
    }

    /**
     * Retrieves all secrets for the project group.
     *
     * [i] iterates over every secret in key vault,
     * so this function may be slow. Prefer getFor().
     *
     * @returns {Promise<Array<any>>} project group secrets list
     */
    async getAll()
    {
        const secrets = {};

        for await (const { tags } of this.client.listPropertiesOfSecrets())
        {
            const { project, env, group, name, path, serialized } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isSerialized = !!+serialized;

            if (project === this.project && group === this.group && env === this.env)
                secrets[name] = await this.get(key, isSerialized);
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
     * [i] faster than getAll()
     *
     * @param {object} secrets object with secrets (key, value).
     * @param {boolean} override if override secrets with default value.
     *
     * @returns {Promise<Array<any>>} project group secrets list
     */
    async getFor(secrets, override = false)
    {
        let promises = {};

        // multi level nested json support.
        secrets = flatten(secrets);

        // executes request
        for (const key in secrets)
        {
            const isArray = Array.isArray(secrets[key]);

            if (override)
                promises[key] = this.get(key, isArray);
            else if (!secrets[key] || isArray && secrets[key].length === 0)
                promises[key] = this.get(key, Array.isArray(secrets[key]));
            else
                promises[key] = secrets[key];
        }

        for (const key in secrets)
        {
            try
            {
                // waits for secret retrieving
                const value = await promises[key];

                secrets[key] = value ?? secrets[key];
            }
            catch
            {
                continue;
            }
        }

        return deflatten(secrets);
    }

    /**
     * Insert or updates many secrets.
     *
     * @param {object} secrets dictionary with secrets (key, value).
     *
     * @returns {Promise<Array<any>>} secrets properties
     */
    async setAll(secrets)
    {
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
     * @returns {Promise<void>}
     */
    async deleteAll()
    {
        for await (const { tags } of this.client.listPropertiesOfSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;

            if (project === this.project && group === this.group && env === this.env)
                await this.delete(key);
        }
    }

    /**
     * Purges every deleted secrets for the project group.
     *
     * @returns {Promise<void>}
     */
    async purgeAll()
    {
        for await (const { properties: tags } of this.client.listDeletedSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;

            if (project === this.project && group === this.group && env === this.env)
                await this.purge(key);
        }
    }

    /**
     * Restores every deleted secrets for the project group.
     *
     * @returns {Promise<void>}
     */
    async restoreAll()
    {
        for await (const { tags } of this.client.listDeletedSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;

            if (project === this.project && group === this.group && env === this.env)
                await this.restore(key);
        }
    }
}
