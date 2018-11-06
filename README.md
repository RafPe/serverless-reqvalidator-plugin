# serverless-reqvalidator-plugin
Serverless plugin to set specific validator request on method

## Installation 
```
npm install serverless-reqvalidator-plugin
```

## Requirements
This require you to have documentation plugin installed
```
serverless-aws-documentation
```


## Using plugin
Specify plugin 
```
plugins:
  - serverless-reqvalidator-plugin
  - serverless-aws-documentation
```


In `serverless.yml` create custom resource for request validators 

```
    xMyRequestValidator:  
      Type: "AWS::ApiGateway::RequestValidator"
      Properties:
        Name: 'my-req-validator'
        RestApiId: 
          Ref: ApiGatewayRestApi
        ValidateRequestBody: true
        ValidateRequestParameters: false  
```

For every function you wish to use the validator set property `reqValidatorName: 'xMyRequestValidator'` to match resource you described 

```
  debug:
    handler: apis/admin/debug/debug.debug
    timeout: 10
    events:
      - http:
          path: admin/debug
          method: get
          cors: true
          private: true 
          reqValidatorName: 'xMyRequestValidator'
```

### Use Validator specified in different Stack
The serverless framework allows us to share resources among several stacks. Therefore a CloudFormation Output has to be specified in one stack. This Output can be imported in another stack to make use of it. For more information see
[here](https://serverless.com/framework/docs/providers/aws/guide/variables/#reference-cloudformation-outputs).

Specify a request validator in a different stack:

```
plugins:
  - serverless-reqvalidator-plugin
service: my-service-a
functions:
  hello:
    handler: handler.myHandler
    events:
      - http:
          path: hello
          reqValidatorName: 'myReqValidator'

resources:
  Resources:
    xMyRequestValidator:
      Type: "AWS::ApiGateway::RequestValidator"
      Properties:
        Name: 'my-req-validator'
        RestApiId: 
          Ref: ApiGatewayRestApi
        ValidateRequestBody: true
        ValidateRequestParameters: false
  Outputs:
    xMyRequestValidator:
      Value:
        Ref: my-req-validator
      Export:
        Name: myReqValidator


```

Make use of the exported request validator in stack b:
```
plugins:
  - serverless-reqvalidator-plugin
service: my-service-b
functions:
  hello:
    handler: handler.myHandler
    events:
      - http:
          path: hello
          reqValidatorName:
            Fn::ImportValue: 'myReqValidator'
```

### Full example 
```
service:
  name: my-service

plugins:
  - serverless-webpack
  - serverless-reqvalidator-plugin
  - serverless-aws-documentation

provider:
  name: aws
  runtime: nodejs6.10
  region: eu-west-2
  environment:
    NODE_ENV: ${self:provider.stage}
custom:
  documentation:
    api:
      info:
        version: '1.0.0'
        title: My API
        description: This is my API
      tags:
        -
          name: User
          description: User Management
    models:
      - name: MessageResponse
        contentType: "application/json"
        schema:
          type: object
          properties:
            message:
              type: string
      - name: RegisterUserRequest
        contentType: "application/json"
        schema:
          required: 
            - email
            - password
          properties:
            email:
              type: string
            password:
              type: string
      - name: RegisterUserResponse
        contentType: "application/json"
        schema:
          type: object
          properties:
            result:
              type: string
      - name: 400JsonResponse
        contentType: "application/json"
        schema:
          type: object
          properties:
            message:
              type: string
            statusCode:
              type: number
  commonModelSchemaFragments:
    MethodResponse400Json:
      statusCode: '400'
      responseModels:
        "application/json": 400JsonResponse

functions:
  signUp:
    handler: handler.signUp
    events:
      - http:
          documentation:
            summary: "Register user"
            description: "Registers new user"
            tags:
              - User
            requestModels:
              "application/json": RegisterUserRequest
          method: post
          path: signup
          reqValidatorName: onlyBody
          methodResponses:
              - statusCode: '200'
                responseModels:
                  "application/json": RegisterUserResponse
              - ${self:custom.commonModelSchemaFragments.MethodResponse400Json}

package:
  include:
    handler.ts

resources:
  Resources:
    onlyBody:  
      Type: "AWS::ApiGateway::RequestValidator"
      Properties:
        Name: 'only-body'
        RestApiId: 
          Ref: ApiGatewayRestApi
        ValidateRequestBody: true
        ValidateRequestParameters: false
```
