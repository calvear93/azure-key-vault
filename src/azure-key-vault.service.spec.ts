import { AzureKeyVault } from 'azure-key-vault.service';
import { AzureKeyVaultConfig, SecretValue } from 'index';
import { AkvClientMock } from '__mocks__/akv-client.mock';

describe('Azure Key Vault Service', () => {
    // SECTION: Init
    let service: AzureKeyVault;
    // common key value pair for test
    const [secretKey, secretValue] = ['key', 'value'];
    // namespace config
    const config: AzureKeyVaultConfig = {
        project: 'test-project',
        group: 'test-group2',
        env: 'test'
    };
    // mocked azure key vault client
    const akvClient = new AkvClientMock();

    // SECTION: Events
    beforeAll(() => {
        service = new AzureKeyVault(config, undefined, akvClient);
    });

    // SECTION: Tests
    test('setted secret name must be prefixed by project-group-env', async () => {
        const expectedName = `${config.project}-${config.group}-${config.env}-${secretKey}`;

        const secret = await service.set(secretKey, secretValue);

        expect(secret.name).toBe(expectedName);
    });

    test('setted secret tags must be match with config', async () => {
        await service.set(secretKey, secretValue);
        const info = await service.getInfo(secretKey);

        const { project, group, env, name } = info.properties.tags as any;

        expect(project).toBe(config.project);
        expect(group).toBe(config.group);
        expect(env).toBe(config.env);
        expect(name).toBe(secretKey);
    });

    test('setted secret name must have correct value', async () => {
        const secret = await service.set(secretKey, secretValue);

        expect(secret.value).toBe(secretValue);
    });

    test('returns the secret value after set it', async () => {
        await service.set(secretKey, secretValue);
        const value = await service.get(secretKey);

        expect(value).toBe(secretValue);
    });

    test('string type value of setted secret must not be serialized', async () => {
        const [strKey, strValue] = ['str', 'anyString'];

        const str = await service.set(strKey, strValue);

        expect(typeof str.value).toBe('string');
        expect(str.properties.tags?.serialized).toBe('0');
    });

    test('object type value of setted secret must be serialized', async () => {
        const secretObjValue: SecretValue = {
            anyProp: 'anyValue',
            anyNumber: 18,
            anyBoolean: true,
            anyNull: null
        };

        const secret = await service.set(secretKey, secretObjValue);
        const value = await service.get(secretKey);

        expect(typeof secret.value).toBe('string');
        expect(secret.properties.tags?.serialized).toBe('1');
        expect(value).toMatchObject(secretObjValue);
    });

    test('array type value of setted secret must be serialized', async () => {
        const secretArrValue: SecretValue = ['anyValue1', 'anyValue2'];

        const secret = await service.set(secretKey, secretArrValue);
        const value = await service.get(secretKey);

        expect(typeof secret.value).toBe('string');
        expect(secret.properties.tags?.serialized).toBe('1');
        expect(value).toMatchObject(secretArrValue);
    });

    test('global variables ($) must be shared across groups but not global must not', async () => {
        const service1 = new AzureKeyVault(
            {
                ...config,
                group: 'test-group-1'
            },
            undefined,
            akvClient
        );

        const service2 = new AzureKeyVault(
            {
                ...config,
                group: 'test-group-2'
            },
            undefined,
            akvClient
        );

        const [nonGlobalKey, nonGlobalValue] = ['key', 'value'];
        const [globalKey, globalValue] = ['$global-key', 'globalValue'];

        await service1.set(globalKey, globalValue);
        const globalValueFromService1 = await service1.get(globalKey);
        const globalValueFromService2 = await service2.get(globalKey);

        // global secret is shared across groups
        expect(globalValueFromService1).toBe(globalValue);
        expect(globalValueFromService2).toBe(globalValue);

        await service1.set(nonGlobalKey, nonGlobalValue);
        const nonGlobalValueFromService1 = await service1.get(nonGlobalKey);
        const nonGlobalValueFromService2 = await service2.get(nonGlobalKey);

        // not global secret must not be shared
        expect(nonGlobalValueFromService1).toBe(nonGlobalValue);
        expect(nonGlobalValueFromService2).not.toBe(nonGlobalValue);
    });

    test('getAll should returns all and only created secrets for project', async () => {
        const values = [
            { key: 'k1', value: 'v1' },
            { key: 'k2', value: 18 },
            { key: 'k3', value: true }
        ];

        const localService = new AzureKeyVault(
            {
                ...config,
                project: 'test-local-project'
            },
            undefined,
            akvClient
        );

        await Promise.all(
            values.map((secret) => localService.set(secret.key, secret.value))
        );

        const secrets = await localService.getAll();

        // all setted value must be in store
        values.forEach(async (secret) => {
            const value = await localService.get(secret.key);

            expect(secrets[secret.key]).toBe(value);
        });

        // all secrets count must be same that setted
        expect(Object.keys(secrets)).toHaveLength(values.length);
    });

    test('setAll must handle nested JSON structures', async () => {
        const secrets: SecretValue = {
            var1: 'var1',
            $global_var2: 'var2',
            group1: {
                var3: 'var3',
                $global_var4: 'var4'
            },
            arr: ['1', 2, '3']
        };

        await service.setAll(secrets);
        const result = await service.getAll();

        expect(result).toMatchObject(secrets);
    });
});