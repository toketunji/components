/*
* Lib: AWS Lambda Deploy
*/

const path = require('path')
const utils = require('../utils')

module.exports = async (inputs, context) => {
  // Load AWS credentials
  const awsCredentials = utils.aws.loadCredentials( // eslint-disable-line
    inputs.provider.accessKeyId,
    inputs.provider.secretAccessKey
  )

  // Build function state object & set defaults
  let state = {
    name: inputs.name,
    code: inputs.code,
    compute: {
      type: 'awsLambda',
      region: inputs.compute.region || 'us-east-1',
      runtime: inputs.compute.runtime || 'nodejs8.10',
      memory: inputs.compute.memory || 512,
      timeout: inputs.compute.timeout || 8,
      root: inputs.compute.root || path.join(process.cwd(), 'code')
    }
  }

  // Deploy AWS Lambda function
  const awsLambda = await context.load('aws-lambda', state.name, {
    name: state.name,
    runtime: state.compute.runtime,
    handler: state.code,
    memory: state.compute.memory,
    timeout: state.compute.timeout,
    root: state.compute.root
  })
  const outputs = await awsLambda.deploy()

  // Update & save state
  state.compute.arn = outputs.arn
  state.compute.roleArn = outputs.roleArn
  context.saveState(state)

  // Return
  return Promise.resolve(state)
}
