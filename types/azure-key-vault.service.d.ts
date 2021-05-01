import { AzureKeyVaultConfig, AzureKeyVaultCredentials } from './azure-key-vault';

/**
 * Class definition for AzureKeyVault.
 *
 * @class AzureKeyVault
 */
export declare class AzureKeyVault
{
    /**
     * Validates emptiness of an object.
     *
     * @constructor
     *
     * @param {AzureKeyVaultConfig} config key vault config
     * @param {string} config.project variables project
     * @param {string} config.group variables group
     * @param {string} config.env environment
     * @param {AzureKeyVaultCredentials} [credentials] key vault config
     * @param {string} credentials.keyVaultUri azure key vault uri
     * @param {string} credentials.clientId service principal name id
     * @param {string} credentials.clientSecret service principal name secret password
     * @param {string} credentials.tenantId tenant id
     */
    constructor(config: AzureKeyVaultConfig, credentials?: AzureKeyVaultCredentials);

    /**
     * Retrieves secret name for current project group.
     *
     * @param {string} key secret key
     * @returns {string} secret name
     */
    secretName(key: string): string;

    /**
     * Retrieves a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.get('car:name');
     *
     * @param {string} key secret key
     *
     * @returns {any} secret
     */
    get(key: string): Promise<any>

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
     * @returns {any} secret
     */
    getInfo(key: string): Promise<any>

    /**
     * Inserts or updates a secret.
     *
     * [!] key should match ^[0-9a-zA-Z-]+$ pattern.
     *
     * [i] for nested property, you can use :, for example:
     *  const carName = await keyVault.set('car:name');
     *
     * @param {string} key secret key
     * @param {string} value secret value
     *
     * @returns {any} secret properties
     */
    set(key: string, value: string): Promise<any>

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
     * @returns {any} deletion info
     */
    delete(key: string): Promise<any>

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
     * @returns {any} purge info
     */
    purge(key: string): Promise<any>

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
     * @returns {any} restoration info
     */
    restore(key: string): Promise<any>

    /**
     * Retrieves all secrets for the project group.
     *
     * [i] iterates over every secret in key vault,
     * so this function may be slow. Prefer getFor().
     *
     * @returns {Promise<any>} project group secrets list
     */
    getAll(): Promise<any>

    /**
     * Retrieves secrets for the project group defined in secrets input.
     * Value for input secret will be replaced if Kev Vault has it.
     *
     * [i] faster than getAll()
     *
     * @param {any} secrets object with secrets (key, value).
     * @param {boolean} override if override secrets with default value.
     *
     * @returns {Promise<any>} project group secrets list
     */
    getFor(secrets: any, override?: boolean): Promise<any>

    /**
     * Insert or updates many secrets.
     * [i] arrays are translated to objects/dictionaries.
     *
     * @param {any} secrets dictionary with secrets (key, value).
     *
     * @returns {Promise<any>} secrets properties
     */
    setAll(secrets: any): Promise<any>

    /**
     * Deletes every secrets for the project group.
     */
    deleteAll(): Promise<void>

    /**
     * Purges every deleted secrets for the project group.
     */
    purgeAll(): Promise<void>

    /**
     * Restores every deleted secrets for the project group.
     */
    restoreAll(): Promise<void>
}
