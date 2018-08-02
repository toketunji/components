/*
* Event Gateway: Remove
*/

const utils = require('../utils')

module.exports = async (inputs, context) => {
  // Configure EventGateway SDK instance
  utils.configEventGateway(inputs.accessKey, inputs.space)

  // Delete Subscriptions
  for (var e in context.state.subscriptions) {
    for (var f in context.state.subscriptions[e]) {
      await utils.deleteSubscription(context.state.subscriptions[e][f].subscriptionId)
    }
  }
  delete context.state.subscriptions
  context.saveState(context.state)

  // Delete Events
  for (var e in context.state.events) {
    try {
      await utils.deleteEvent(context.state.events[e].name)
    } catch (err) {
      if (!err.message.includes('not found')) {
        throw new Error(err)
      }
    }
  }
  delete context.state.events
  context.saveState(context.state)

  // Delete CORS
  for (var p in context.state.cors) {
    for (var m in context.state.cors[p]) {
      try {
        await utils.deleteCORS(context.state.cors[p][m].corsId)
      } catch (err) {
        if (!err.message.includes('not found')) {
          throw new Error(e)
        }
      }
    }
  }
  delete context.state.cors
  context.saveState(context.state)

  // Delete Functions
  for (var f in context.state.functions) {
    try {
      await utils.deleteFunction(context.state.functions[f].functionId)
    } catch (err) {
      if (!err.message.includes('not found')) {
        throw new Error(err)
      }
    }
  }
  context.saveState({})

  return {}
}
