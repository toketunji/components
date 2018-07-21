# Serverless Function

## Syntax

```yaml
# serverless.yml

components:
  myFunction:
    type: function
    inputs:
      name: myFunction # Defaults to prop
      code: index.handler
      compute:
        type: awsLambda # Compute target
        region: us-east-1
        runtime: nodejs8.10
        env:
          foo: bar
```
