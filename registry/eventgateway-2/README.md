# Event Gateway

## Syntax

```yaml
type: serverless-event-gateway
inputs:

  # Events
  events:
    myapp.user.create:
      authorizerId: myappAuthorize # Optional, defaults to no authorizer
      # schema: Coming soon...

  # Functions
  functions:
    # AWS Lambda
    myappAuthorize:
      type: awsLambda
      provider:
        arn: 1234
        region: us-east-1
        awsAccessKeyId: 1234
        awsSecretAccessKey: 1234

  # Subscriptions
  subscriptions:
    myapp.user.create:
      createUser:
        sync: true # Optional, defaults to async
        path: /users # Optional, defaults to /
        method: POST # Optional, defaults to POST
```








<!-- Old Syntax Approach  -->
<!-- # Events
events:
  - type: myapp.user.created
    authorizerId: myappAuthorize # Optional

# Functions
functions:
  # AWS Lambda
  - type: awsLambda
    name: myappAuthorize
    provider:
      arn: 1234
      region: us-east-1
      awsAccessKeyId: 1234
      awsSecretAccessKey: 1234

# Subscriptions
subscriptions:
  - type: sync # Defaults to async
    path: / # Defaults to /
    method: POST # Defaults to POST
    event: myapp.user.created
    function: myappAuthorize -->
