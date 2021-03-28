#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import AzureKeyVault from '../azure-key-vault.service';
import { getArgs } from './cmd.util';
import { flatten, deflatten } from '../flaten.util';

const CURRENT_DIR = process.cwd();

(async () =>
{
    const args = getArgs();

    const { project, group, env, uri, spn, password, tenant } = args;

    // initializes key vault handler
    const keyVault = new AzureKeyVault({ project, group, env }, {
        keyVaultUri: uri,
        clientId: spn,
        clientSecret: password,
        tenantId: tenant
    });

    // command reducer
    switch (args.cmd)
    {
        case 'getFor':
            {
                const { file, output } = args;

                if (!file)
                    throw new Error('"file" param is required"');

                if (!output)
                    throw new Error('"output" param is required"');

                // reads secrets definition file
                const input = require(path.resolve(CURRENT_DIR, file));
                console.log(JSON.stringify(flatten(input), null, 4));
                const flat = flatten(input);
                const restored = deflatten(flat);
                console.log(JSON.stringify(restored, null, 4));

                // const secrets = await keyVault.getFor(flattenObj(input));

                // // saves output file with secrets
                // const data = JSON.stringify(assignValues(input, secrets), null, 4);
                // fs.writeFileSync(path.resolve(CURRENT_DIR, output), data);
            }
            break;

        case 'update':
            {
                const { file } = args;

                if (!file)
                    throw new Error('"file" param is required"');

                // updates key vault secrets
                const secrets = require(path.resolve(CURRENT_DIR, file));
                await keyVault.setAll(secrets);
            }
            break;

        default:
            throw new Error(`akv command "${args.cmd}" doesn't exists`);
    }
})();
