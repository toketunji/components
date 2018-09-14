const SDK = require('@serverless/event-gateway-sdk')

async function updateFunction(inputs) {
  const { url, space, accessKey, functionId, type, provider } = inputs
  const eg = new SDK(url, space, accessKey)

  return eg.updateFunction({ functionId, type, provider })
}

module.exports = updateFunction
