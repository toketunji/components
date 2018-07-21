# Serverless Service

## Syntax

```yaml
type: service
inputs:

  # Config
  app: ${env.SERVERLESS_APP_DEV}
  domain: ${env.SERVERLESS_APP_DEV}-${self.serviceId}.com

  # Providers
  providers:
    serverless:
      accessKey: ${env.SERVERLESS_ACCESS_KEY_DEV}
    aws:
      accessKeyId: ${env.AWS_ACCESS_KEY_ID}
      secretAccessKey: ${env.AWS_SECRET_ACCESS_KEY}

  # Events
  events:
    myapp.user.create:
      authorizer: myappAuthorize # Optional, defaults to no authorizer

  # Functions
  functions:
    userCreate:
      code: users.create

  # Subscriptions
  subscriptions:
    myapp.user.create:
      createUser:
        sync: true # Optional, defaults to false
        path: /users # Optional, defaults to '/'
        method: POST # Optional, defaults to POST

  # Defaults
  defaults:
    function:
      compute:
        type: awsLambda
        runtime: nodejs8.10
        root: ${self.path}/code
        env:
          usersDb: users-${self.serviceId}
```
