const Ajv = require('ajv');
const yaml = require('js-yaml');
const fs = require('fs');

const { ServerlessReqValidatorPluginConfigSchema } = require('../src/index');

const ajv = new Ajv();

const validateConfig = ajv.compile({
  type: 'object',
  ...ServerlessReqValidatorPluginConfigSchema,
});

describe('serverless-reqvalidator-plugin schema', () => {
  it('should validate a configuration without reqValidatorName property', () => {
    const config = yaml.load(fs.readFileSync('./test/fixtures/noValidatorFunction.yaml', 'utf8'));

    const valid = validateConfig(config.functions.hello.events[0].http);
    expect(valid).toBeTruthy();
  });

  it('should validate a configuration with a local reqValidatorName property', () => {
    const config = yaml.load(fs.readFileSync('./test/fixtures/localValidatorFunction.yaml', 'utf8'));

    const valid = validateConfig(config.functions.hello.events[0].http);
    expect(valid).toBeTruthy();
  });

  it('should validate a configuration with an external reqValidatorName property', () => {
    const config = yaml.load(fs.readFileSync('./test/fixtures/externalValidatorFunction.yaml', 'utf8'));

    const valid = validateConfig(config.functions.hello.events[0].http);
    expect(valid).toBeTruthy();
  });

  it('should not validate a configuration with an invalid reqValidatorName property', () => {
    const config = yaml.load(fs.readFileSync('./test/fixtures/invalidValidatorFunction.yaml', 'utf8'));
    const valid = validateConfig(config.functions.hello.events[0].http);
    expect(valid).toBeFalsy();
  });
});
