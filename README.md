# Azure Key Vault

Node library for handle Azure Key Vault, abstracts secrets management by project, environment and group when vault is shared.
Also, this library handles nested JSON structures.

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
        otherConfig: {
            SECRET3: 'my secret 3',
        },
    });

    const mySecret2 = await keyVault.getInfo('SECRET2');
    console.log(mySecret2);
    // name is 'my-project-dev-web-secret2' and value 'my secret 2'

    const mySecret3 = await keyVault.getInfo('otherConfig:SECRET3');
    console.log(mySecret3);
    // name is 'my-project-dev-web-otherConfig--secret3' and value 'my secret 3'

    const mySecrets = await keyVault.getFor({
        SECRET1: null,
        SECRET2: 'default value',
        otherConfig: {
            SECRET3: null,
        },
        SECRET4: 'def for secret 4',
    });
    console.log(mySecrets);
    // prints { SECRET1: 'my secret 1, SECRET2: 'my secret 2', otherConfig: { SECRET3: 'my secret 3' }, SECRET4: 'def for secret 3' }
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

### **Functions**

Library has functions for manage key vault secrets.

[i] You can use ':' for nested path, (i.e. `car:props:name`)
[i] You can prefix your key with '&' for project shared secret, (i.e. `car:props:$name`)

-   **get**: returns secret value.

| Parameters   | Description                           |
| ------------ | ------------------------------------- |
| `key`        | (string) secret key                   |
| `serialized` | (boolean) whether value is serialized |

```javascript
const value = await keyVault.get('my-secret');
```

-   **getInfo**: returns secret info.

| Parameters | Description         |
| ---------- | ------------------- |
| `key`      | (string) secret key |

```javascript
const info = await keyVault.getInfo('my-secret');
```

-   **set**: inserts or updates secret value.

| Parameters | Description         |
| ---------- | ------------------- |
| `key`      | (string) secret key |
| `value`    | (string) secret key |

```javascript
const info = await keyVault.set('my-secret', 'my secret value');
```

-   **delete**: deletes a secret.

| Parameters | Description         |
| ---------- | ------------------- |
| `key`      | (string) secret key |

```javascript
const deletionInfo = await keyVault.delete('my-secret');
```

-   **purge**: purges a deleted secret.

| Parameters | Description         |
| ---------- | ------------------- |
| `key`      | (string) secret key |

```javascript
const info = await keyVault.purge('my-secret');
```

-   **restore**: restores a deleted secret.

| Parameters | Description         |
| ---------- | ------------------- |
| `key`      | (string) secret key |

```javascript
const restoredInfo = await keyVault.restore('my-secret');
```

-   **getAll**: gets all secrets for the project, env and group.

```javascript
const listOfSecrets = await keyVault.getAll();
```

-   **getFor**: (faster than getAll) gets all secrets for the project, env and group defined in input object. **In order to get array correctly deserialized, use [] as default value instead of null or undefined**.

| Parameters   | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `secrets`    | (any) object with secrets (key, value)                                           |
| `[override]` | (boolean) (default: false) whether secrets with default value should be override |

```javascript
let secrets = {
    '$global-var': null,
    'my-secret': null,
    'my-secret-2': 'default value',
    'my-secret-group1': {
        'my-secret-3': null
    },
    // in case of array type variable, default must be
    // an array (or empty array) for correct deserialize
    'my-array-secret': []
};

const listOfSecrets = await keyVault.getFor(secrets);
```

-   **setAll**: insert or updates a set of secrets.

| Parameters | Description                            |
| ---------- | -------------------------------------- |
| `secrets`  | (any) object with secrets (key, value) |

```javascript
let secrets = {
    '$global-var': 'my shared secret',
    'my-secret': 'my secret',
    'my-secret-2': 'my secret 2',
    'my-secret-group1': {
        'my-secret-3': 'my secret 3'
    },
    'my-array-secret': ['a', 'b', 'c']
};

const listOfProperties = await keyVault.setAll(secrets);
```

-   **deleteAll**: deletes every secrets for the project group.

| Parameters   | Description            |
| ------------ | ---------------------- |
| `skipGlobal` | skips global variables |

```javascript
const info = await keyVault.deleteAll();
```

-   **purgeAll**: purges every deleted secrets for the project group.

| Parameters   | Description            |
| ------------ | ---------------------- |
| `skipGlobal` | skips global variables |

```javascript
const info = await keyVault.purgeAll();
```

-   **restoreAll**: restores every deleted secrets for the project group.

| Parameters   | Description            |
| ------------ | ---------------------- |
| `skipGlobal` | skips global variables |

```javascript
const info = await keyVault.restoreAll();
```

### **Commands**

Library has node commands for use with npm.
Every commands needs credentials arguments for connect to key vault.

| Parameters   | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `--project`  | (string) project name                                                          |
| `--group`    | (string) secrets group                                                         |
| `--env`      | (string) environment                                                           |
| `--uri`      | (string) key vault uri (i.e. https://my-key-vault.vault.azure.net)             |
| `--spn`      | (string) service principal name id (i.e. f176a774-239e-4cd3-8551-88fd9fb9b441) |
| `--password` | (string) spn secret password (i.e. WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku)           |
| `--tenant`   | (string) tenant id (i.e. 9dba8525-be64-4d10-b124-e6f1644ae513)                 |

You should define your npm script command in **package.json** as:

```json
// package.json
{
    ...,
    "scripts": {
        ...,
        "akv": "akv --project=my-project --group=web --tenant=9dba8525-be64-4d10-b124-e6f1644ae513",
        ...
    },
    ...
}
```

-   **getFor**: writes a file with secrets as JSON, using a JSON file as secrets structure definition.

| Parameters | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `--file`   | (string) relative uri (from cmd root) for JSON file for structure definition |
| `--output` | (string) relative uri for result secrets JSON file                           |

```cmd
foo@bar:~$ npm run akv getFor -- \
    --env=dev \
    --uri=https://my-key-vault.vault.azure.net \
    --spn=f176a774-239e-4cd3-8551-88fd9fb9b441 \
    --password=WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku \
    --file=secrets-structure-definition.json \
    --output=my-secrets.json \
    --override
```

-   **getAll**: writes all secrets (for project, group and env) in a JSON file.

| Parameters | Description                                        |
| ---------- | -------------------------------------------------- |
| `--output` | (string) relative uri for result secrets JSON file |

```cmd
foo@bar:~$ npm run akv getAll -- \
    --env=dev \
    --uri=https://my-key-vault.vault.azure.net \
    --spn=f176a774-239e-4cd3-8551-88fd9fb9b441 \
    --password=WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku \
    --output=my-secrets.json \
    --override
```

-   **publish**: creates or updates secrets (for project, group and env) in key vault from a JSON file.

| Parameters | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| `--file`   | (string) relative uri (from cmd root) for JSON file with secrets |

```cmd
foo@bar:~$ npm run akv publish -- \
    --env=dev \
    --uri=https://my-key-vault.vault.azure.net \
    --spn=f176a774-239e-4cd3-8551-88fd9fb9b441 \
    --password=WyBwkmcL8rGQe9B2fvRLDrqDuannE4Ku \
    --file=my-secrets.json
```

-   **clear**: deletes all secrets (for project, group and env) in key vault.

-   **restore**: restores all deleted secrets (for project, group and env) in key vault.

## Linting 🧿

Project uses ESLint, for code formatting and code styling normalizing.

-   **eslint**: JavaScript and React linter with Airbnb React base config and some other additions.

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
