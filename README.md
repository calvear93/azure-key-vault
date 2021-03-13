# Azure Key Vault

Node library for handle Azure Key Vault, abstracts secrets management by project, environment and group when vault is shared.

## How To Use 💡

Should be initialized with AzureKeyVault as:

```javascript
import { AzureKeyVault } from '@calvear/azure-key-vault';

// initializes azure key vault
const keyVault = new AzureKeyVault(
    {
        project: 'my-project',
        group: 'web',
        env: 'dev',
    },
    {
        keyVaultUri: 'https://my-key-vault.vault.azure.net',
        clientId: 'f176a774-239e-4cd3-8551-88fd9fb9b441',
        clientSecret: 'WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku',
        tenantId: '9dba8525-be64-4d10-b124-e6f1644ae513',
    }
);

async function main() {
    await keyVault.setAll({
        SECRET1: 'my secret 1',
        SECRET2: 'my secret 2',
    });

    const mySecret2 = await keyVault.getInfo('SECRET2');
    console.log(mySecret2);
    // name is 'my-project-dev-web-secret2' and value 'my secret 2'

    const mySecrets = await keyVault.getFor({
        SECRET1: null,
        SECRET2: 'default value',
        SECRET3: 'def for secret 3',
    });
    console.log(mySecrets);
    // prints { SECRET1: 'my secret 1, SECRET2: 'my secret 2', SECRET3: 'def for secret 3' }
}

main();
```

You can initialize key vault with environment variables as:

```javascript
import { AzureKeyVault } from '@calvear/azure-key-vault';

...
process.env.AZURE_KEY_VAULT_URI = 'https://my-key-vault.vault.azure.net';
process.env.AZURE_CLIENT_ID = 'f176a774-239e-4cd3-8551-88fd9fb9b441';
process.env.AZURE_CLIENT_SECRET = 'WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku';
process.env.AZURE_TENANT_ID = '9dba8525-be64-4d10-b124-e6f1644ae513';
...

// initializes azure key vault
const keyVault = new AzureKeyVault({
    project: 'my-project',
    group: 'web',
	env: 'dev'
});

...
```

### Functions

Library has functions for manage key vault secrets.

-   **get**: returns secret value.

```javascript
const value = await keyVault.get('my-secret');
```

-   **getInfo**: returns secret info.

```javascript
const info = await keyVault.getInfo('my-secret');
```

-   **set**: inserts or updates secret value.

```javascript
const info = await keyVault.set('my-secret', 'my secret value');
```

-   **delete**: deletes a secret.

```javascript
const deletionInfo = await keyVault.delete('my-secret');
```

-   **purge**: purges a deleted secret.

```javascript
const info = await keyVault.purge('my-secret');
```

-   **restore**: restores a deleted secret.

```javascript
const restoredInfo = await keyVault.restore('my-secret');
```

-   **getAll**: gets all secrets for the project, env and group.

```javascript
const listOfSecrets = await keyVault.getAll();
```

-   **getFor**: (faster than getAll) gets all secrets for the project, env and group defined in input object.

```javascript
let secrets = {
    'my-secret': null,
    'my-secret-2': 'default value',
};

const listOfSecrets = await keyVault.getFor(secrets);
```

-   **setAll**: insert or updates a set of secrets.

```javascript
let secrets = {
    'my-secret': 'my secret',
    'my-secret-2': 'my secret 2',
};

const listOfProperties = await keyVault.setAll(secrets);
```

-   **deleteAll**: deletes every secrets for the project group.

```javascript
const info = await keyVault.deleteAll();
```

-   **purgeAll**: purges every deleted secrets for the project group.

```javascript
const info = await keyVault.purgeAll();
```

-   **restoreAll**: restores every deleted secrets for the project group.

```javascript
const info = await keyVault.restoreAll();
```

## Linting 🧿

Project uses ESLint, for code formatting and code styling normalizing.

-   **eslint**: JavaScript and React linter with Airbnb React base config and some other additions.
-   **prettier**: optional Prettier config.

For correct interpretation of linters, is recommended to use [Visual Studio Code](https://code.visualstudio.com/) as IDE and install the plugins in .vscode folder at 'extensions.json', as well as use the config provided in 'settings.json'

## Changelog 📄

For last changes see [CHANGELOG.md](CHANGELOG.md) file for details.

## Built with 🛠️

-   [@azure/identity](https://www.npmjs.com/package/@azure/identity) - azure identity provider.
-   [@azure/keyvault-secrets](https://www.npmjs.com/package/@azure/keyvault-secrets) - azure key vault bae handler.

## License 📄

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) file for details.

---

⌨ by [Alvear Candia, Cristopher Alejandro](https://github.com/calvear93)
