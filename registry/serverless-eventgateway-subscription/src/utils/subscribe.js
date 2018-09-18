const SDK = require('@serverless/event-gateway-sdk')

async function subscribe(inputs) {
  const { url, space, accessKey, type, eventType, functionId, path, method } = inputs
  const eg = new SDK(url, space, accessKey)

  return eg.subscribe({ type, eventType, functionId, path, method })
}

module.exports = subscribe
