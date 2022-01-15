
/**
 * Azure Key Vault config object.
 *
 * @export
 * @interface AzureKeyVaultConfig
 */
export interface AzureKeyVaultConfig
{
    project: string,
    group?: string,
    env?: string
    sharedGroup?: string
}

/**
 * Azure Identity Service Principal Name Credentials.
 *
 * @export
 * @interface AzureKeyVaultCredentials
 */
export interface AzureKeyVaultCredentials
{
    keyVaultUri: string,
    clientId: string,
    clientSecret: string,
    tenantId: string
}
