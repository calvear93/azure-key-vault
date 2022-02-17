export type SecretKey = string;

export type SecretValue =
    | string
    | number
    | null
    | undefined
    | AzureKeyVaultSecrets
    | (string | number)[];

export interface AzureKeyVaultSecrets {
    [key: SecretKey]: SecretValue;
}
