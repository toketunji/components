/*
* Service: Deploy
*/

const utils = require('../utils') // eslint-disable-line

module.exports = async (inputs, context) => {
  // Set defaults
  let events = {}
  let functions = {}
  let subscriptions = {}
  context.state = context.state || {}
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
    const fn = await context.load('../../components/function', functions[f].name, functions[f])
    const fnOutputs = await fn.deploy()
    functions[f].compute.arn = fnOutputs.compute.arn
    functions[f].compute.region = fnOutputs.compute.region
    // Update & Save state
    context.state.functions[functions[f].name] = functions[f]
    context.saveState(context.state)
  }

  /*
  * Deploy: Events & Subscriptions
  */

  // Massage data into the format the EventGateway Component expects
  const egInputs = {
    space: inputs.app,
    accessKey: inputs.providers.serverless.accessKey,
    events: {},
    functions: {},
    subscriptions: subscriptions
  }
  for (var e in events) {
    egInputs.events[e] = {
      space: inputs.app,
      name: e,
      authorizerId: events[e].authorizerId || null
    }
  }
  for (var f in functions) {
    egInputs.functions[f] = {
      space: inputs.app,
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

  const eg = await context.load('../../components/eventgateway', 'subscriptions', egInputs)
  const egOutputs = await eg.deploy()

  // Update & Save state
  context.state.events = egOutputs.events
  context.state.subscriptions = egOutputs.subscriptions
  context.saveState(context.state)

  return {}
}
