/*
* Lib: AWS Lambda Deploy
*/

const utils = require('../utils')

module.exports = async (inputs, context) => {
  // Load AWS credentials
  const awsCredentials = utils.aws.loadCredentials( // eslint-disable-line
    inputs.provider.accessKeyId,
    inputs.provider.secretAccessKey
  )

  // Remove AWS Lambda Function
  const awsLambda = await context.load('aws-lambda', context.state.name, {
    name: context.state.name,
    runtime: context.state.compute.runtime,
    handler: context.state.code,
    memory: context.state.compute.memory,
    timeout: context.state.compute.timeout,
    root: context.state.compute.root
  })
  await awsLambda.remove()

  // Update & save state
  context.saveState({})

  // Return
  return {}
}
