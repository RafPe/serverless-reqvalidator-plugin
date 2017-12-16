'use strict';

/**
 * 
 * Adds the posibility to configure AWS_IAM for your API Gateway endpoints
 * and "Invoke with caller credentials"
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
 *  Resources used:
 *  - https://www.snip2code.com/Snippet/1467589/adds-the-posibility-to-configure-AWS_IAM/
 */
class ServerlessReqValidatorPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');
    const naming  = this.serverless.providers.aws.naming;

    this.getMethodLogicalId = naming.getMethodLogicalId.bind(naming);
    this.normalizePath = naming.normalizePath.bind(naming);

    this._beforeDeploy = this.beforeDeploy.bind(this)

    this.hooks = {
      'before:deploy:deploy': this._beforeDeploy
    };

    this.documentationParts = [];
  }

  beforeDeploy() {
    if (!(this.serverless.service.custom['aaa'] && this.serverless.service.custom )) return;

    let validatorsMap = this.serverless.service.custom['aaa']

    console.log( JSON.stringify(validatorsMap) )
    console.log('-----------------')
    console.log( JSON.stringify(this.serverless.service.functions) )
    console.log('-----------------')

    const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources
    
        console.log('Begin Attach plugin...')
    
        // Filter for any IAM Roles defined in CFT and apply our Managed Policies.
        // && resources[resourceName].Properties.HttpMethod === 'POST' 
        Object.keys(resources)
          .filter(resourceName => resources[resourceName].Type === 'AWS::ApiGateway::Method')
          .forEach(roleResource =>
            {



              // Here we iterate every method
              console.log(JSON.stringify(resources[roleResource]))
              resources[roleResource].Properties.RequestValidatorId = {"Ref":"xMyRequestValidator"};
              console.log(JSON.stringify(resources[roleResource]))
            }
          )



    var xcfTemplate = this.serverless.service.provider.compiledCloudFormationTemplate;

    //console.log(JSON.stringify(xcfTemplate))
    // Add models to method resources
    this.serverless.service.getAllFunctions()
    .forEach(functionName => 
      {
        //console.log(`This is ${functionName}`)

        // const func = this.serverless.service.getFunction(functionName);
        // func.events.forEach(this.updateCfTemplateFromHttp.bind(this));    
      }
    );



  }
}

module.exports = ServerlessReqValidatorPlugin;