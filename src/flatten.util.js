/**
 * Flatten a object keeping depth path
 * in key using -- as level separator.
 *
 * @param {any} obj
 * @param {string} pkey first level key. Must be undefined.
 *
 * @returns {any} flatten object.
 */
export function flatten(obj, pkey)
{
    const flattened = {};

    for (const key in obj)
    {
        if (typeof obj[key] === 'object' && obj[key] !== null)
            Object.assign(flattened, flatten(obj[key], `${pkey ? `${pkey}--` : ''}${key}`));
        else
            flattened[`${pkey ? `${pkey}--` : ''}${key}`] = obj[key];
    }

    return flattened;
}

/**
 * Deflatten a object with depth
 * definition in it's keys, with --.
 *
 * @param {any} obj
 *
 * @returns {any} deflatten object.
 */
export function deflatten(obj)
{
    const restored = {};

    for (const key in obj)
        rearmTree(restored, key.split('--'), obj[key]);

    return restored;
}

/**
 * Rebuilds property tree from a key
 * with depth definition using --.
 *
 * @param {any} restored current restored object.
 * @param {Array<string>} members main key splitted by --.
 * @param {any} value node value.
 */
function rearmTree(restored, members, value)
{
    const [ pkey, ...rest ] = members;

    if (members.length === 1)
    {
        restored[pkey] = value;
    }
    else
    {
        if (!restored[pkey])
            restored[pkey] = {};

        rearmTree(restored[pkey], rest, value);
    }
}
