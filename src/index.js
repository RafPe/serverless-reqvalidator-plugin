'use strict';

/**
 * Adds using of custom created request validator on specific functions by 
 * adding `reqValidatorName`
 *
 * Usage:
 *
 *   myFuncGetItem:
 *     handler: myFunc.get
 *     name: ${self:provider.stage}-myFunc-get-item
 *     events:
 *       - http:
 *           method: GET
 *           path: mypath
 *           cors: true
 *           reqValidatorName: 'xyz'
 * 
 * Alternative usage:
 *
 *   myFuncGetItem:
 *     handler: myFunc.get
 *     name: ${self:provider.stage}-myFunc-get-item
 *     events:
 *       - http:
 *           method: GET
 *           path: mypath
 *           cors: true
 *           reqValidatorName: 
 *            Fn::ImportValue: 'my-import-value'
 * 
 *  Resources used:
 *  - https://www.snip2code.com/Snippet/1467589/adds-the-posibility-to-configure-AWS_IAM/
 */

class ServerlessReqValidatorPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');
    const naming = this.serverless.providers.aws.naming;

    this.getMethodLogicalId = naming.getMethodLogicalId.bind(naming);
    this.normalizePath = naming.normalizePath.bind(naming);

    this._beforeDeploy = this.beforeDeploy.bind(this)

    // Create schema for your properties. For reference use https://github.com/ajv-validator/ajv
    serverless.configSchemaHandler.defineFunctionEventProperties('aws', 'http', {
      properties: {
        reqValidatorName: { type: 'string' },
      },
      required: ['reqValidatorName'],
    });

    this.hooks = {
      'before:package:finalize': this._beforeDeploy
    };

  }

  beforeDeploy() {

    const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources

    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const functionObject = this.serverless.service.functions[functionName];

      functionObject.events.forEach(event => {

        if (!event.http) { return; }

        const reqValidatorName = event.http.reqValidatorName;
        if (reqValidatorName) {

          let path;
          let method;

          if (typeof event.http === 'object') {
            path = event.http.path;
            method = event.http.method;
          } else if (typeof event.http === 'string') {
            path = event.http.split(' ')[1];
            method = event.http.split(' ')[0];
          }

          const resourcesArray = path.split('/');
          // resource name is the last element in the endpoint. It's not unique.
          const resourceName = path.split('/')[path.split('/').length - 1];
          const normalizedResourceName = resourcesArray.map(this.normalizePath).join('');
          const normalizedMethod = method[0].toUpperCase() + method.substr(1).toLowerCase();
          const methodName = `ApiGatewayMethod${normalizedResourceName}${normalizedMethod}`;

          switch (typeof reqValidatorName) {
            case 'object':
              if (reqValidatorName['Fn::ImportValue']) {
                resources[methodName].Properties.RequestValidatorId = reqValidatorName;
              } else { // other use cases should be added here
                resources[methodName].Properties.RequestValidatorId = reqValidatorName;
              }
              break;
            case 'string':
            default:
              resources[methodName].Properties.RequestValidatorId = { "Ref": `${reqValidatorName}` };
              break;
          }
        }
      });
    }
    )
  }

}

module.exports = ServerlessReqValidatorPlugin;
