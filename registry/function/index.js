/*
* Function
*/

const lib = require('./lib')

/*
* Deploy
* - Deploys via type of compute
* - Defaults to AWS Lambda
*/

const deploy = async (inputs, context) => {
  // Set defaults
  inputs.compute = inputs.compute || {}

  switch (inputs.compute.type) {
    case 'awsLambda':
      return lib.awsLambdaDeploy(inputs, context)
      break
    default:
      return lib.awsLambdaDeploy(inputs, context)
      break
  }
}

/*
* Remove
*/

const remove = async (inputs, context) => {
  switch (inputs.compute.type) {
    case 'awsLambda':
      return lib.awsLambdaRemove(inputs, context)
      break
    default:
      return lib.awsLambdaRemove(inputs, context)
      break
  }
}

module.exports = {
  deploy,
  remove
}
