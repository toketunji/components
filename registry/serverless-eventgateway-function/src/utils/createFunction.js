const SDK = require('@serverless/event-gateway-sdk')

async function createFunction(inputs) {
  const { url, space, accessKey, functionId, type, provider } = inputs
  const eg = new SDK(url, space, accessKey)

  return eg.createFunction({ functionId, type, provider })
}

module.exports = createFunction
