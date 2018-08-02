/* eslint-disable */

/*
* Service: Deploy
*/

const utils = require('../utils')

module.exports = async (inputs, context) => {

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
  context.state.options = context.state.options || {}

  // Platform: Create Deployment
  const deployment = {
    version: '0.1.0',
    accessKey: inputs.providers.serverless.accessKey,
    tenant: inputs.providers.serverless.tenant,
    app: inputs.providers.serverless.app,
    serviceName: inputs.name,
    state: {
      app: inputs.providers.serverless.app,
      tenant: inputs.providers.serverless.tenant,
      accessKey: inputs.providers.serverless.accessKey,
      version: '0.1.0',
      service: {
        name: inputs.name,
        description: inputs.description || null,
        repository: inputs.repository || null,
        provider: {
          name: 'aws',
          region: 'us-east-1',
          accountId: '123',
        },
      },
      functions: [],
      subscriptions: [],
      resources: []
    }
  }

  try {
    const createdDeployment = await utils.platform.createDeployment(deployment)
    deployment.deploymentId = createdDeployment.id
  } catch (e) {
    console.log(e)
  }

  /*
  * Prepare Data for processing: Events, Functions, Subscriptions
  */

  // Prepare Events
  for (var e in inputs.events) {
    // Add optional prefix to the beginning of the event type
    if (inputs.options.event && inputs.options.event.prefix) {
      e = inputs.options.event.prefix + '.' + e
    }
    events[e] = e || {}
  }

  // Prepare Functions
  for (var f in inputs.functions) {
    functions[f] = {
      name: f,
      code: inputs.functions[f].code,
      compute: inputs.functions[f].compute || {}
    }
    if (inputs.options && inputs.options.function && inputs.options.function.compute) {
      // Do a deep copy using JSON methods otherwise you will run into issues w/ object references
      functions[f].compute = JSON.parse(
        JSON.stringify(Object.assign(inputs.options.function.compute, functions[f].compute || {}))
      )
    }
    if (functions[f].compute.type === 'awsLambda') {
      functions[f].provider = inputs.providers.aws
    }
  }

  // Prepare Subscriptions
  for (var e in inputs.subscriptions) {

    inputs.subscriptions[e] = typeof inputs.subscriptions[e] == 'object' ? inputs.subscriptions[e] : {}

    let sub = typeof inputs.subscriptions[e] == 'object' ? inputs.subscriptions[e] : {}
    // Add optional prefix to the beginning of the event type
    if (inputs.options.subscription && inputs.options.subscription.prefix) {
      e = inputs.options.subscription.prefix + '.' + e
    }
    subscriptions[e] = subscriptions[e] || {}
    for (var f in sub) {
      sub = sub[f] || {}
      subscriptions[e][f] = sub
      subscriptions[e][f].sync = sub.sync || false
      subscriptions[e][f].path = sub.path || '/'
      subscriptions[e][f].method = sub.method || 'POST'
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
      name: e,
      authorizerId: events[e].authorizerId || null
    }
  }
  for (var f in functions) {
    egInputs.functions[f] = {
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
    await utils.platform.succeedDeployment(deployment, context.state)
  } catch (e) {
    console.log(e)
  }

  // TODO: Improve later
  console.log(``)
  console.log(`${context.state.name}: successfully deployed`)
  console.log(`${context.state.name}: dashboard url - https://dashboard.serverless.com/tenants/${context.state.tenant}/applications/${context.state.app}/services/${context.state.name}`)
  console.log(``)

  return {}
}
