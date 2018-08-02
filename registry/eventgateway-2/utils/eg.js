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
  // Check to see if this was already registered in another Service to avoid overwriting
  let exists = false
  // TODO: Replace with show method when it's available
  return eventGateway
    .listEventTypes()
    .then((data) => {
      data.forEach((d) => {
        if (d.name !== evt.name) return
        if (d.metadata && d.metadata.serviceId !== evt.metadata.serviceId) {
          throw new Error(
            `Event "${evt.name}" is already registered in another Service with the ID of "${
              d.metadata.serviceId
            }"`
          )
        } else {
          exists = true
        }
      })
    })
    .then(() => {
      if (!exists) {
        return eventGateway.createEventType(evt)
      } else {
        return eventGateway.updateEventType(evt)
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

  // Check to see if this was already registered in another Service to avoid overwriting
  let exists = false
  // TODO: Replace with show method when it's available
  return eventGateway
    .listFunctions()
    .then((data) => {
      data.forEach((d) => {
        if (d.functionId !== f.functionId) return
        if (d.metadata && d.metadata.serviceId !== f.metadata.serviceId) {
          throw new Error(
            `Function with ID "${
              f.functionId
            }" is already registered in another Service with the ID of "${d.metadata.serviceId}"`
          )
        } else {
          exists = true
        }
      })
    })
    .then(() => {
      if (!exists) {
        return eventGateway.createFunction(f)
      } else {
        return eventGateway.updateFunction(f)
      }
    })
}

/*
* Create Or Update Subscription
* - TODO: Add EG SDK updateSubscription method when it's created
* - TODO: Since you can't go into the EG UI and delete subscriptions when state gets messed up.  Code a fallback which lists Subscriptions and finds the one to delete.
*/

function createOrUpdateSubscription(s, subscriptionId) {
  // Check to see if this was already registered in another Service to avoid overwriting
  let exists = false
  // TODO: Replace with show method when it's available
  return eventGateway
    .listSubscriptions()
    .then((data) => {
      data.forEach((d) => {
        if (
          subscriptionId === undefined &&
          s.path.toLowerCase() == d.path.toLowerCase() &&
          s.method.toLowerCase() == d.method.toLowerCase() &&
          s.eventType == d.eventType &&
          s.functionId == d.functionId &&
          s.type == d.type
        ) {
          throw new Error(
            `Subscription with the Path of "${s.path}", Method of "${s.method}", Event Type of "${
              s.eventType
            }", Function ID of "${s.functionId}", Subscription Type of "${
              s.type
            }", is already registered in Service with the ID of "${d.metadata.serviceId}"`
          )
        }

        if (subscriptionId && d.subscriptionId == subscriptionId) {
          exists = true
          if (d.metadata && d.metadata.serviceId !== s.metadata.serviceId) {
            throw new Error(
              `Subscription with the ID of "${subscriptionId}" is already registered in Service with the ID of "${
                d.metadata.serviceId
              }"`
            )
          }
        }
      })
    })
    .then(() => {
      if (!exists) {
        return eventGateway.subscribe(s)
      } else {
        // TODO: Use updateSubscription method when it's available
        return eventGateway.unsubscribe({ subscriptionId: subscriptionId }).then(() => {
          return eventGateway.subscribe(s)
        })
      }
    })
}

/*
* CreateOrUpdateCORS
*/

// TODO: Don't overwrite.  Can we use metadata for this?

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
