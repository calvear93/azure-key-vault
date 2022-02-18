export type SecretKey = string;

export type SecretValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | AzureKeyVaultSecrets
    | (string | number)[];

export interface AzureKeyVaultSecrets {
    [key: SecretKey]: SecretValue;
}
