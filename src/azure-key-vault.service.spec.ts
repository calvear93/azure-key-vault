import { AzureKeyVault } from 'azure-key-vault.service';
import { AzureKeyVaultConfig, SecretValue } from 'index';
import { AkvClientMock } from '__mocks__/akv-client.mock';

describe('Azure Key Vault Service', () => {
    let service: AzureKeyVault;

    const [secretKey, secretValue] = ['key', 'value'];

    const config: AzureKeyVaultConfig = {
        project: 'test-project',
        group: 'test-group',
        env: 'test'
    };

    beforeEach(() => {
        service = new AzureKeyVault(config, undefined, new AkvClientMock());
    });

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

    test('object type value of setted secret must be serialized', async () => {
        const secretObjValue: SecretValue = {
            anyProp: 'anyValue',
            anyNumber: 18,
            anyBoolean: true,
            anyNull: null
        };

        const secret = await service.set(secretKey, secretObjValue);
        const value = await service.get(secretKey);
        // const value = await service.getInfo(secretKey);

        expect(value).toMatchObject(secretObjValue);
        // expect(secret.value).toMatchObject(secretObjValue);
    });

    // it('ts', async () => {
    //     await service.set('hola', 1);
    //     const a = await service.getInfo('hola');

    //     expect(1).toBe(1);
    // });
});
