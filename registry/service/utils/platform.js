/* eslint-disable */

const uuid = require('uuid')
const platform = require('@serverless/platform-sdk')
const EventGateway = require('@serverless/event-gateway-sdk')

/*
* Emit
* - Emit a CloudEvent
*/

const emit = (tenant, app, type, data) => {
  let evt = {}
  evt.eventType = type
  evt.eventID = uuid.v4()
  evt.source = '/' + app
  evt.extensions = {}
  evt.data = data || {}
  evt.cloudEventsVersion = '0.1'
  evt.contentType = 'application/json'

  const eventGateway = new EventGateway({
    url: `https://${tenant}-${app}.slsgateway.com`
  })
  return eventGateway.emit(evt)
}

/*
* Transform
* - Transform Service Component state to Platform state
*/

const transform = (deployment, state) => {

  // Populate functions

  const platform_function = {
    functionId: null,
    details: {
      runtime: null,
      memory: null,
      timeout: null
    },
    package: {
      handler: null,
      name: null,
      arn: null
    }
  }

  // TODO: Support other compute providers
  for (stateFn in state.functions) {
    stateFn = state.functions[stateFn]
    platformFn = JSON.parse(JSON.stringify(platform_function))
    platformFn.functionId = stateFn.name

    platformFn.details.runtime = stateFn.compute.runtime
    platformFn.details.memory = stateFn.compute.memory
    platformFn.details.timeout = stateFn.compute.timeout

    platformFn.package.name = stateFn.name
    platformFn.package.handler = stateFn.code
    platformFn.package.arn = stateFn.compute.arn

    deployment.state.functions.push(platformFn)
  }

  // Populate Event Gateway subscriptions
  // TODO: This is a strange data model.  Find out why it's implemented this way

  const platform_subscription_eventgateway = {
    functionId: null,
    type: null,
    details: {
      type: null, // sync or async
      function: null,
      source: null,
      path: '/',
      method: 'POST',
      app: null,
      service: null,
      stage: null
    },
    provider: {
      name: null,
      tenant: null
    },
    properties: {
      name: null,
      service: null,
      stage: null
    },
    event: {
      type: null,
      eventType: null,
      path: null,
      method: null,
    }
  }

  for (evt in state.subscriptions) {
    for (stateSub in state.subscriptions[evt]) {

      stateSub = state.subscriptions[evt][stateSub]
      platformSub = JSON.parse(JSON.stringify(platform_subscription_eventgateway))
      platformSub.subscriptionId = uuid.v4()
      platformSub.functionId = stateSub.functionId
      platformSub.type = stateSub.eventType

      platformSub.details.app = state.app
      platformSub.details.service = state.name
      platformSub.details.type = stateSub.type
      platformSub.details.function = stateSub.functionId
      platformSub.details.eventType = stateSub.eventType
      platformSub.details.source = `/${state.app}`
      platformSub.details.path = stateSub.path
      platformSub.details.method = stateSub.method

      platformSub.provider.name = 'Serverless'
      platformSub.provider.tenant = state.tenant

      platformSub.properties.name = stateSub.eventType
      platformSub.properties.service = state.name
      platformSub.properties.stage = null

      platformSub.event.type = stateSub.type
      platformSub.event.eventType = stateSub.eventType
      platformSub.event.path = stateSub.path
      platformSub.event.method = stateSub.method

      deployment.state.subscriptions.push(platformSub)
    }
  }

  // Return
  return deployment
}

/*
* Create Deployment
*/

const createDeployment = (deployment) => {
  return platform.createDeployment(deployment)
}

/*
* Update Deployment
*/

const failDeployment = (deployment) => {
  deployment.status = 'Failed'
  return platform.updateDeployment(deployment)
  .then(() => {
    // Publish a deployment event
    return emit(
      state.tenant,
      state.app,
      'framework.deployment.failed',
      {
        tenant: state.tenant,
        app: state.app,
        service: state.name,
        time: Date.now(),
        deployment: deployment
      }
    )
  })
}

/*
* Publish
* - Publish to the serverless platform
*/

const succeedDeployment = (deployment, state) => {
  // Convert data to match Platform's format
  deployment = transform(deployment, state)
  deployment.status = 'success'
  return platform.updateDeployment(deployment)
  .then(() => {
    // Publish a deployment event
    return emit(
      state.tenant,
      state.app,
      'framework.deployment.success',
      {
        tenant: state.tenant,
        app: state.app,
        service: state.name,
        time: Date.now(),
        deployment: deployment
      }
    )
  })
}

/*
* Archive
* - Archive the service on the serverless platform
*/

const archive = (tenant, app, name, accessKey) => {
  const data = {
    tenant,
    app,
    name,
    accessKey
  }
  return platform.archiveService(data)
}

module.exports = {
  createDeployment,
  failDeployment,
  succeedDeployment,
  archive
}
