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

export function deflatten(obj)
{
    const restored = {};

    for (const key in obj)
        rearmTree(restored, key.split('--'), obj[key]);

    return restored;
}

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
