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
     * @param {string} [config.sharedGroup] variables shared group
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

        const { project, group, env, sharedGroup = 'SHARED' } = config;

        this.project = project;
        this.group = group;
        this.env = env;
        this.sharedGroup = sharedGroup; // for project shared variables
        // calculates secret name prefix for project group
        this.prefix = `${project}${group ? `-${group}` : ''}${env ? `-${env}` : ''}`;
        this.prefixShared = `${project}${env ? `-${env}` : ''}`;
        this.client = new SecretClient(process.env.AZURE_KEY_VAULT_URI ?? '', new DefaultAzureCredential());
    }

    /**
     * Retrieves secret name for current project group.
     *
     * @param {string} key secret key
     * @param {boolean} [isShared] project shared secret (prefixed with $)
     *
     * @returns {string} secret name
     */
    secretName(key, isShared = false)
    {
        const prefix = isShared ? this.prefixShared : this.prefix;

        return `${prefix}-${key}`
            .replace(/[_ ]+/g, '-')
            .replace(/:/g, '--')
            .replace(/[$]/g, '')
            .toLowerCase();
    }

    /**
     * Retrieves a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.get('car:name');
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {string} key secret key
     * @param {bool} serialized whether value is serialized
     *
     * @returns {any | string | null} secret
     */
    async get(key, serialized = false)
    {
        const isShared = key.includes('$');

        try
        {
            const { value } = await this.client.getSecret(this.secretName(key, isShared));

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
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} secret
     */
    getInfo(key)
    {
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
     * @param {string} key secret key
     * @param {string | any} value secret value
     *
     * @returns {Promise<any>} secret properties
     */
    set(key, value)
    {
        // extracts name and member path in case of nested prop.
        const sections = key.split(':');
        const path = sections.slice(0, -1).join(':') ?? '';
        const name = sections.at(-1);

        const isShared = name[0] === '$';
        const shouldBeSerialized = typeof value !== 'string';

        return this.client.setSecret(
            this.secretName(key, isShared),
            shouldBeSerialized ? JSON.stringify(value) : value,
            {
                tags: {
                    name,
                    path,
                    env: this.env,
                    project: this.project,
                    group: isShared ? this.sharedGroup : this.group,
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
     * @param {string} key secret key
     *
     * @returns {Promise<any>} deletion info
     */
    async delete(key)
    {
        const isShared = key.includes('$');

        try
        {
            const poller = await this.client.beginDeleteSecret(this.secretName(key, isShared));

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
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} purge info
     */
    purge(key)
    {
        const isShared = key.includes('$');

        try
        {
            return this.client.purgeDeletedSecret(this.secretName(key, isShared));
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
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
     *
     * @param {string} key secret key
     *
     * @returns {Promise<any>} restoration info
     */
    async restore(key)
    {
        const isShared = key.includes('$');

        try
        {
            const recover = await this.client.beginRecoverDeletedSecret(this.secretName(key, isShared));

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
     * [i] for project shared property, you can prefix $, for example:
     *  const globalVar = await keyVault.set('parent:$global_var');
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
            const isShared = group === this.sharedGroup;
            const isSerialized = !!+serialized;

            if (project === this.project && env === this.env && (isShared || group === this.group))
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
     * [i] about 4 times faster than getAll()
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
     * @param {boolean} skipShared skips shared vars
     *
     * @returns {Promise<void>}
     */
    async deleteAll(skipShared = true)
    {
        for await (const { tags } of this.client.listPropertiesOfSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (project === this.project && env === this.env && (isShared || group === this.group))
                await this.delete(key);
        }
    }

    /**
     * Purges every deleted secrets for the project group.
     *
     * @param {boolean} skipShared skips shared vars
     *
     * @returns {Promise<void>}
     */
    async purgeAll(skipShared = true)
    {
        for await (const { properties: tags } of this.client.listDeletedSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (project === this.project && env === this.env && (isShared || group === this.group))
                await this.purge(key);
        }
    }

    /**
     * Restores every deleted secrets for the project group.
     *
     * @param {boolean} skipShared skips shared vars
     *
     * @returns {Promise<void>}
     */
    async restoreAll(skipShared = true)
    {
        for await (const { tags } of this.client.listDeletedSecrets())
        {
            const { project, env, group, name, path } = tags ?? {};

            const key = (path ? `${path}:` : '') + name;
            const isShared = !skipShared && group === this.sharedGroup;

            if (project === this.project && env === this.env && (isShared || group === this.group))
                await this.restore(key);
        }
    }
}
