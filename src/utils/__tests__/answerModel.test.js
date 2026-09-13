const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_ANSWER_MODEL, getAnswerModelOptions } = require('../../config/answerModel');
const gateway = require('../../../site/lib/gatewayConfig');
const storage = require('../../storage');

test('desktop and independently deployed gateway share the GLM model policy', () => {
    assert.equal(DEFAULT_ANSWER_MODEL, 'z-ai/glm-5.3-flash');
    assert.equal(DEFAULT_ANSWER_MODEL, gateway.DEFAULT_MODEL);
    assert.deepEqual(getAnswerModelOptions(DEFAULT_ANSWER_MODEL), { reasoning: { effort: 'low', exclude: true } });
    assert.deepEqual(getAnswerModelOptions(DEFAULT_ANSWER_MODEL), gateway.getAnswerModelOptions(gateway.DEFAULT_MODEL));
    assert.deepEqual(getAnswerModelOptions('custom/model'), {});
});

describe('answer model storage migration', () => {
    let tempDir;
    let originalNodeEnv;
    let originalConfigDir;
    beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV;
        originalConfigDir = process.env.MENACE_TEST_CONFIG_DIR;
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'menace-model-test-'));
        process.env.NODE_ENV = 'test';
        process.env.MENACE_TEST_CONFIG_DIR = tempDir;
    });
    afterEach(() => {
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalNodeEnv;
        if (originalConfigDir === undefined) delete process.env.MENACE_TEST_CONFIG_DIR;
        else process.env.MENACE_TEST_CONFIG_DIR = originalConfigDir;
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    function seed(model) {
        fs.writeFileSync(path.join(tempDir, 'config.json'), JSON.stringify({
            configVersion: 1, onboarded: true, openrouterDefaultsV2: true, openrouterDefaultsV3: true,
            openrouterModel: model, layout: 'compact',
        }));
    }

    test('new installations default to GLM', () => {
        storage.initializeStorage();
        assert.equal(storage.getConfig().openrouterModel, DEFAULT_ANSWER_MODEL);
    });

    for (const model of [undefined, 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemini-3.5-flash-lite']) {
        test(`upgrades previous default ${model} without resetting user data`, () => {
            seed(model);
            fs.mkdirSync(path.join(tempDir, 'history'));
            fs.writeFileSync(path.join(tempDir, 'history', 'session.json'), '{"preserved":true}');
            storage.initializeStorage();
            const config = storage.getConfig();
            assert.equal(config.openrouterModel, DEFAULT_ANSWER_MODEL);
            assert.equal(config.onboarded, true);
            assert.equal(config.layout, 'compact');
            assert.equal(config.openrouterDefaultsV4, true);
            assert.equal(fs.readFileSync(path.join(tempDir, 'history', 'session.json'), 'utf8'), '{"preserved":true}');
        });
    }

    test('preserves custom model selection', () => {
        seed('custom/model');
        storage.initializeStorage();
        assert.equal(storage.getConfig().openrouterModel, 'custom/model');
    });

    test('runs once and preserves a later deliberate selection of the old model', () => {
        seed('google/gemini-3.5-flash-lite');
        storage.initializeStorage();
        storage.updateConfig('openrouterModel', 'google/gemini-3.5-flash-lite');
        storage.initializeStorage();
        assert.equal(storage.getConfig().openrouterModel, 'google/gemini-3.5-flash-lite');
    });
});
