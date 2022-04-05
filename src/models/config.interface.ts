export interface AzureKeyVaultConfig {
    // name of the project secrets belongs to
    project: string;
    // variables group name
    group?: string;
    // environment like dev, qa, prod, etc.
    env?: string;
    // variables group name in case of common group
    sharedGroup?: string;
}

export interface AzureKeyVaultCredentials {
    // service principal name id
    clientId: string;
    // service principal name secret password
    clientSecret: string;
    // azure active directory tenant id
    tenantId: string;
}
