/* eslint-disable */

/*
* AWS S3 Website
*/

const utils = require('./utils')

/*
* Deploy
*/

const deploy = async (inputs, context) => {
  let state = {
    name: context.id.split(':')[0],
    domain: inputs.domain,
    s3Domain: `http://${inputs.domain}.s3-website-${inputs.region || 'us-east-1'}.amazonaws.com`,
    assets: inputs.assets
  }

  return utils
    .createWebsiteBucket(inputs.domain)
    .catch(() => {})
    .then(() => {
      return utils.uploadDir(inputs.domain, inputs.assets, inputs.env)
    })
    .catch(() => {})
    .then(() => {
      context.saveState(state)

      // TODO: Improve later
      console.log(``)
      console.log(`${state.name}: successfully deployed`)
      console.log(`${state.name}: your domain is - ${state.s3Domain}`)
      console.log(``)

      return state
    })
}

/*
* Remove
*/

const remove = async (inputs, context) => {
  return utils.deleteWebsiteBucket(inputs.domain).then(() => {
    context.saveState({})
  })
}

module.exports = {
  deploy,
  remove
}
