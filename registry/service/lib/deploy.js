/* eslint-disable */

/*
* Service: Deploy
*/

const utils = require('../utils')

module.exports = async (inputs, context) => {
  // Platform: Create Deployment
  const deployment = {
    version: '0.1.0',
    accessKey: inputs.providers.serverless.accessKey,
    tenant: inputs.providers.serverless.tenant,
    app: inputs.providers.serverless.app,
    serviceName: inputs.name
  }
  try {
    deployment.deploymentId = await utils.platform.createDeployment(deployment)
  } catch (e) {
    // console.log(e)
  }

  // Set defaults
  let events = {}
  let functions = {}
  let subscriptions = {}
  context.state = context.state || {}
  context.state.tenant = inputs.providers.serverless.tenant
  context.state.app = inputs.providers.serverless.app
  context.state.name = inputs.name
  context.state.description = inputs.description
  context.state.events = context.state.events || {}
  context.state.functions = context.state.functions || {}
  context.state.subscriptions = context.state.subscriptions || {}
  context.state.defaults = context.state.defaults || {}

  /*
  * Prepare Data for processing: Events, Functions, Subscriptions
  */

  // Prepare Events
  for (var e in inputs.events) {
    events[e] = inputs.events[e] || {}
  }

  // Prepare Functions
  for (var f in inputs.functions) {
    functions[f] = {
      name: f,
      code: inputs.functions[f].code,
      compute: inputs.functions[f].compute || {}
    }
    if (inputs.defaults && inputs.defaults.function && inputs.defaults.function.compute) {
      // Do a deep copy using JSON methods otherwise you will run into issues w/ object references
      functions[f].compute = JSON.parse(
        JSON.stringify(Object.assign(inputs.defaults.function.compute, functions[f].compute || {}))
      )
    }
    if (functions[f].compute.type === 'awsLambda') {
      functions[f].provider = inputs.providers.aws
    }
  }

  // Prepare Subscriptions
  for (var e in inputs.subscriptions) {
    subscriptions[e] = subscriptions[e] || {}
    for (var s in inputs.subscriptions[e]) {
      subscriptions[e][s] = inputs.subscriptions[e][s] || {}
      subscriptions[e][s].sync = inputs.subscriptions[e][s].sync || false
      subscriptions[e][s].path = inputs.subscriptions[e][s].path || '/'
      subscriptions[e][s].method = inputs.subscriptions[e][s].method || 'POST'
    }
  }

  /*
  * Deploy: Functions
  */

  for (var f in functions) {
    const fn = await context.load('function', functions[f].name, functions[f])
    const fnOutputs = await fn.deploy()
    functions[f].compute.arn = fnOutputs.compute.arn
    functions[f].compute.region = fnOutputs.compute.region
    functions[f].compute.memory = fnOutputs.compute.memory
    functions[f].compute.timeout = fnOutputs.compute.timeout
    // Update & Save state
    context.state.functions[functions[f].name] = functions[f]
    context.saveState(context.state)
  }

  /*
  * Deploy: Events & Subscriptions
  */

  // Requires "tenant-app" format for "space"
  const space = `${inputs.providers.serverless.tenant}-${inputs.providers.serverless.app}`

  // Massage data into the format the EventGateway Component expects
  const egInputs = {
    space: space,
    accessKey: inputs.providers.serverless.accessKey,
    events: {},
    functions: {},
    subscriptions: subscriptions
  }
  for (var e in events) {
    egInputs.events[e] = {
      space: space,
      name: e,
      authorizerId: events[e].authorizerId || null
    }
  }
  for (var f in functions) {
    egInputs.functions[f] = {
      space: space,
      functionId: f,
      type: functions[f].compute.type,
      provider: {
        arn: functions[f].compute.arn,
        region: functions[f].compute.region,
        awsAccessKeyId: functions[f].provider.accessKeyId,
        awsSecretAccessKey: functions[f].provider.secretAccessKey
      }
    }
  }
  for (var e in subscriptions) {
    for (var f in subscriptions[e]) {
      subscriptions[e][f].eventType = e
      subscriptions[e][f].functionId = f
      if (subscriptions[e][f].sync) {
        subscriptions[e][f].type = 'sync'
      } else {
        subscriptions[e][f].type = 'async'
      }
      delete subscriptions[e][f].sync
    }
  }

  const eg = await context.load('eventgateway-2', 'subscriptions', egInputs)
  const egOutputs = await eg.deploy()

  // Update & Save state
  context.state.events = egOutputs.events
  context.state.subscriptions = egOutputs.subscriptions
  context.saveState(context.state)

  // Platform: Succeed Deployment
  try {
    await utils.platform.succeedDeployment(deployment)
  } catch (e) {
    // console.log(e)
  }

  // TODO: Improve later
  console.log(``)
  console.log(`${context.state.name}: successfully deployed`)
  console.log(``)

  return {}
}
