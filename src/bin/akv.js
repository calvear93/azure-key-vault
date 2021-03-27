#!/usr/bin/env node
import { getArgs } from './cmd.util';
import path from 'path';
import fs from 'fs';
import AzureKeyVault from '../azure-key-vault.service';

const CURRENT_DIR = process.cwd();

(async () =>
{
    const args = getArgs();

    // initializes key vault handler
    const keyVault = new AzureKeyVault({
        project: args.project,
        group: args.group,
        env: args.env
    }, {
        keyVaultUri: args.uri,
        clientId: args.spn,
        clientSecret: args.password,
        tenantId: args.tenant
    });

    // command routering
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
                const secrets = await keyVault.getFor(input);

                // saves output file with secrets
                const data = JSON.stringify(secrets, null, 4);
                fs.writeFileSync(path.resolve(CURRENT_DIR, output), data);
            }
            break;

        case 'update':
            console.log('yeh');
            break;

        default:
            throw new Error(`akv command "${args._[0]}" doesn't exists`);
    }
})();
