#!/usr/bin/env node
import parseParams from 'minimist';
import AzureKeyVault from '../azure-key-vault.service';

(async () =>
{
    const args = parseParams(process.argv.slice(2));

    console.log(`yeah, the arguments are ${JSON.stringify(args)}`);

    switch (args._[0])
    {
        case 'getFor':
            console.log('yeh');
            break;

        default:
            console.error('no command provided');
            break;
    }

    // let filePath = path.resolve(__dirname, "../files/somefile.txt")

    // const kv = new AzureKeyVault({
    //     project: 'achs-virtual',
    //     group: 'web',
    //     env: 'qa'
    // }, {
    //     keyVaultUri: 'https://kv-qa-ittec-sti.vault.azure.net',
    //     clientId: '4beb8852-aba3-4ee8-9bdb-32876e1bc632',
    //     clientSecret: 'qNRjd.~Yf2Pz2D2-0Jq6--DxS31MPCn5l9',
    //     tenantId: '6d4bbe0a-5654-4c69-a682-bf7dcdaed8e7'
    // });

    // await kv.setAll({
    // 	REACT_APP_DEBUG_VALUE1: 'debug 1',
    // 	REACT_APP_DEBUG_VALUE2: 'debug 2',
    // 	REACT_APP_DEBUG_VALUE3: 'debug 3',
    // 	REACT_APP_DEBUG_VALUE4: 'debug 4',
    // });

    // const env = await kv.getFor({
    //     REACT_APP_DEBUG_VALUE3: null,
    //     REACT_APP_DEBUG_VALUE5: 'test'
    // });

    // console.log('Secrets: ', JSON.stringify(env));
})();
