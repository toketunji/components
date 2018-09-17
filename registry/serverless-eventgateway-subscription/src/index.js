const { subscribe, unsubscribe } = require('./utils')

// "public" functions
async function deploy(inputs, context) {
  const { type, functionId, eventType, url } = inputs

  const subscribeMessage = `Creating ${type} subscription for function "${functionId}" and event type "${eventType}" at Event Gateway "${url}"...`

  let subscriptionObj
  if (!Object.keys(context.state).length) {
    context.log(subscribeMessage)
    subscriptionObj = await subscribe(inputs)
  } else {
    context.log(
      `Removing ${type} subscription for function "${functionId}" and event type "${eventType}" from Event Gateway "${url}"...`
    )
    await unsubscribe(inputs)
    context.log(subscribeMessage)
    subscriptionObj = await subscribe(inputs)
  }

  const { subscriptionId } = subscriptionObj

  const outputs = { subscriptionId }
  const state = { ...subscriptionObj, url }

  context.saveState(state)

  return outputs
}

async function remove(inputs, context) {
  const { type, functionId, eventType, url } = context.state

  context.log(
    `Removing ${type} subscription for function "${functionId}" and event type "${eventType}" from Event Gateway "${url}"...`
  )

  await unsubscribe(context.state)

  context.saveState()
  return {}
}

module.exports = {
  deploy,
  remove
}
