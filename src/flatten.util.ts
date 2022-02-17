import {
    AzureKeyVaultSecrets,
    SecretKey,
    SecretValue
} from './models/secrets.interface';

/**
 * Flatten a object keeping depth path
 * in key using -- as level separator.
 *
 * @param {AzureKeyVaultSecrets} secrets
 * @param {Key} namespace current level key
 *
 * @returns {AzureKeyVaultSecrets} flatten secrets
 */
export function flatten(
    secrets: AzureKeyVaultSecrets,
    namespace: SecretKey = ''
): AzureKeyVaultSecrets {
    const flattened: AzureKeyVaultSecrets = {};

    // iterate over first level
    for (const key in secrets) {
        const value = secrets[key];

        if (typeof value !== 'object' || value === null) {
            flattened[`${namespace}${key}`] = value;

            continue;
        }

        if (Array.isArray(value)) flattened[`${namespace}${key}`] = value;
        // next level recursively
        else Object.assign(flattened, flatten(value, `${namespace}${key}--`));
    }

    return flattened;
}

/**
 * Deflatten a object with depth
 * definition in it's keys, with --.
 *
 * @param {AzureKeyVaultSecrets} secrets
 *
 * @returns {AzureKeyVaultSecrets} deflatten secrets
 */
export function deflatten(secrets: AzureKeyVaultSecrets): AzureKeyVaultSecrets {
    // mutable, will contain deflatten secrets
    const restored: AzureKeyVaultSecrets = {};

    // for each property, calc hierarchy tree
    // i.e. "level1--level2--level3": value --> "level1": {"level2": {"level3": value}}
    for (const key in secrets)
        rearmTree(restored, key.split('--'), secrets[key]);

    return restored;
}

/**
 * Rebuilds property tree from a key
 * with depth definition using --.
 *
 * @param {AzureKeyVaultSecrets} restored current restored object
 * @param {string[]} members main key splitted by --
 * @param {SecretValue} value node value
 */
function rearmTree(
    restored: AzureKeyVaultSecrets,
    members: string[],
    value: SecretValue
): void {
    const [namespace, ...rest] = members;

    if (members.length === 1) {
        restored[namespace] = value;
    } else {
        // initializes nested object
        if (!restored[namespace]) restored[namespace] = {};

        rearmTree(restored[namespace] as AzureKeyVaultSecrets, rest, value);
    }
}
