/* eslint-disable */

/*
* Event Gateway: Temporary helpers to help with EG when things go wrong
*/

const EventGateway = require('@serverless/event-gateway-sdk')

module.exports = async (inputs, context) => {
  if (!context.options.id) {
    throw new Error(`The event gateway subscription id is required.  Please use "--id 123"`)
  }

  let space = inputs.providers.serverless.tenant + '-' + inputs.providers.serverless.app

  const eventGateway = new EventGateway({
    accessKey: inputs.providers.serverless.accessKey,
    space: space,
    url: `https://${space}.slsgateway.com`
  })

  // try {
  //   await eventGateway.unsubscribe({ subscriptionId: context.options.id })
  // } catch(err) {
  //   throw new Error(err)
  // }

  try {
    console.log(await eventGateway.listSubscriptions())
  } catch (err) {
    throw new Error(err)
  }

  // try {
  //   console.log(await eventGateway.listEventTypes())
  // } catch(err) {
  //   throw new Error(err)
  // }

  return {}
}
