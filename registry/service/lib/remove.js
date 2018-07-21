/*
* Service: Remove
*/

const utils = require('../utils') // eslint-disable-line

/*
* Remove Events & Subscriptions
*  - First you have to reinstantiate the EG instance (ugh!)
* - This includes the bare minimum to instantiate the EG Component and enable it to delete the corresponding records
*/

module.exports = async (inputs, context) => {
  const egInputs = {
    space: inputs.app,
    accessKey: inputs.providers.serverless.accessKey,
    events: {},
    functions: {},
    subscriptions: context.state.subscriptions
  }
  for (var e in context.state.events) {
    egInputs.events[e] = {
      space: inputs.app,
      name: e
    }
  }
  for (var f in context.state.functions) {
    egInputs.functions[f] = {
      space: inputs.app,
      functionId: context.state.functions[f].name,
      type: context.state.functions[f].compute.type,
      provider: {
        arn: context.state.functions[f].compute.arn,
        region: context.state.functions[f].compute.region,
        awsAccessKeyId: context.state.functions[f].provider.accessKeyId,
        awsSecretAccessKey: context.state.functions[f].provider.secretAccessKey
      }
    }
  }
  const eg = await context.load('eventgateway-2', 'subscriptions', egInputs)
  await eg.remove()
  delete context.state.events
  delete context.state.subscriptions
  context.saveState(context.state)

  /*
  * Remove Functions
  */

  for (var f in context.state.functions) {
    const fn = await context.load(
      'function',
      context.state.functions[f].name,
      context.state.functions[f]
    )
    await fn.remove()
    // Update & save state
    delete context.state.functions[f]
    context.saveState(context.state)
  }

  context.saveState({})
  return {}
}
