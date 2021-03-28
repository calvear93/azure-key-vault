#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { getArgs } from './cmd.util';
import AzureKeyVault from '../azure-key-vault.service';

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
        case 'getfor':
            {
                const { file, output, override } = args;

                if (!file)
                    throw new Error('"file" param is required');

                if (!output)
                    throw new Error('"output" param is required');

                // reads secrets definition file
                const input = require(path.resolve(CURRENT_DIR, file));
                const secrets = await keyVault.getFor(input, override);

                // saves output file with secrets
                const data = JSON.stringify(secrets, null, 4);
                fs.writeFileSync(path.resolve(CURRENT_DIR, output), data);
            }
            break;

        case 'getall':
            {
                const { output } = args;

                if (!output)
                    throw new Error('"output" param is required');

                // gets all secrets
                const secrets = await keyVault.getAll();

                // saves output file with secrets
                const data = JSON.stringify(secrets, null, 4);
                fs.writeFileSync(path.resolve(CURRENT_DIR, output), data);
            }
            break;

        case 'publish':
            {
                const { file } = args;

                if (!file)
                    throw new Error('"file" param is required');

                // updates key vault secrets
                const secrets = require(path.resolve(CURRENT_DIR, file));
                await keyVault.setAll(secrets);
            }
            break;

        case 'clear':
            await keyVault.deleteAll();
            break;

        case 'restore':
            await keyVault.restoreAll();
            break;

        default:
            throw new Error(`akv command "${args.cmd}" doesn't exists`);
    }
})();
