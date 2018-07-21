/*
* Utils: EventGateway Helpers
*/

const EventGateway = require('@serverless/event-gateway-sdk')
let eventGateway

/*
* Configure Event Gateway Instance
*/

function configEventGateway(accessKey, space) {
  eventGateway = new EventGateway({
    accessKey: accessKey,
    space: space,
    url: `https://${space}.slsgateway.com`
  })
}

/*
* Create Or Update Event
*/

async function createOrUpdateEvent(evt) {
  return eventGateway.createEventType(evt).catch((error) => {
    if (error.message.includes('already exists')) {
      // Update
      return eventGateway.updateEventType(evt)
    } else {
      throw new Error(error)
    }
  })
}

/*
* Create Or Update Function
*/

function createOrUpdateFunction(f) {
  // Sanitization & Validation
  f.type = f.type.toLowerCase()
  if (f.type == 'http' && !f.provider.url) {
    throw new Error('Missing "url" property in function provider')
  }
  return eventGateway.createFunction(f).catch((error) => {
    if (error.message.includes('already registered')) {
      // Update
      return eventGateway.updateFunction(f)
    } else {
      throw new Error(error.message)
    }
  })
}

/*
* Create Or Update Subscription
* - TODO: Add EG SDK updateSubscription method when it's created
* - TODO: Since you can't go into the EG UI and delete subscriptions when state gets messed up.  Code a fallback which lists Subscriptions and finds the one to delete.
*/

function createOrUpdateSubscription(s, subscriptionId) {
  return eventGateway
    .unsubscribe({ subscriptionId: subscriptionId })
    .catch((error) => {
      // For whatever reason (user errors), sometimes the state can get out of sync.
      // This is a patch to help it until we think of something better.
      if (!error.message.includes('not found')) {
        throw new Error(error.message)
      }
    })
    .then(() => {
      return eventGateway.subscribe(s)
    })
}

/*
* CreateOrUpdateCORS
*/

function createOrUpdateCORS(c) {
  if (!c.corsId) {
    return eventGateway.createCORS(c).catch((error) => {
      throw new Error(error.message)
    })
  } else {
    return eventGateway.updateCORS(c).catch((error) => {
      throw new Error(error.message)
    })
  }
}

/*
* Delete Subscription
*/

async function deleteSubscription(subscriptionId) {
  return eventGateway.unsubscribe({ subscriptionId }).catch((error) => {
    // For whatever reason (user errors), sometimes the state can get out of sync.
    // This is a patch to help it until we think of something better.
    if (!error.message.includes('not found')) {
      throw new Error(error.message)
    }
  })
}

/*
* Delete Event
*/

async function deleteEvent(name) {
  return eventGateway.deleteEventType({ name })
}

/*
* Delete Function
*/

async function deleteFunction(functionId) {
  return eventGateway.deleteFunction({ functionId })
}

/*
* Delete CORS
*/

async function deleteCORS(corsId) {
  return eventGateway.deleteCORS({ corsId })
}

/*
* Exports
*/

module.exports = {
  configEventGateway: configEventGateway,
  createOrUpdateEvent: createOrUpdateEvent,
  createOrUpdateFunction: createOrUpdateFunction,
  createOrUpdateSubscription: createOrUpdateSubscription,
  createOrUpdateCORS: createOrUpdateCORS,
  deleteSubscription: deleteSubscription,
  deleteEvent: deleteEvent,
  deleteFunction: deleteFunction,
  deleteCORS: deleteCORS
}
