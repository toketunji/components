/* eslint-disable */

const platform = require('@serverless/platform-sdk')

/*
* Transform
* - Transform Service Component state to Platform state
*/

const transform = (deployment, state) => {
  // Populate Service
  deployment.state = {
    version: '0.1.0',
    service: {
      name: state.name,
      description: state.description || null,
      repository: state.repository || null,
      provider: [
        {
          name: 'serverless'
        },
        {
          name: 'aws'
        },
      ]
    },
    functions: [],
    subscriptions: []
  }

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
    details: {
      type: null, // Event Type
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
    }
  }

  for (evt in state.subscriptions) {
    for (stateSub in state.subscriptions[evt]) {
      stateSub = state.subscriptions[evt][stateSub]
      platformSub = JSON.parse(JSON.stringify(platform_subscription_eventgateway))
      platformSub.functionId = stateSub.functionId

      platformSub.details.app = state.app
      platformSub.details.service = state.name
      platformSub.details.type = stateSub.eventType
      platformSub.details.stage = null
      platformSub.details.function = stateSub.functionId
      platformSub.details.source = `/${state.app}`
      platformSub.details.path = stateSub.path
      platformSub.details.method = stateSub.method

      platformSub.provider.name = 'Serverless'
      platformSub.provider.tenant = state.tenant

      platformSub.properties.name = state.eventType
      platformSub.properties.tenant = state.tenant
      platformSub.properties.stage = null

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
}

/*
* Publish
* - Publish to the serverless platform
*/

const succeedDeployment = (deployment, state) => {
  // Convert data to match Platform's format
  deployment = transform(deployment, state)
  deployment.status = 'Success'
  return platform.updateDeployment(deployment)
}

/*
* Archive
* - Archive the service on the serverless platform
*/

const archive = (service) => {}

module.exports = {
  createDeployment,
  failDeployment,
  succeedDeployment
}
