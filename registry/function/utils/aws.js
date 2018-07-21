/*
* Utils: AWS Helpers
*/

/*
* Load Credentials
*/

function loadCredentials(accessKey, secretKey) {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env
  let credentials = {
    awsAccessKeyId: accessKey || AWS_ACCESS_KEY_ID || null,
    awsSecretAccessKey: secretKey || AWS_SECRET_ACCESS_KEY || null
  }
  if (AWS_SESSION_TOKEN) {
    credentials = {
      ...credentials,
      awsSessionToken: AWS_SESSION_TOKEN
    }
  }
  return credentials
}

/*
* Get Function ID
*/

function getFunctionId(lambdaArn) {
  const matchRes = lambdaArn.match(new RegExp('(.+):(.+):(.+):(.+):(.+):(.+):(.+)'))
  return matchRes ? matchRes[7] : ''
}

/*
* Get AWS Lambda Region
*/

function getRegion(lambdaArn) {
  const matchRes = lambdaArn.match(new RegExp('(.+):(.+):(.+):(.+):(.+):(.+):(.+)'))
  return matchRes ? matchRes[4] : ''
}

/*
* Export
*/

module.exports = {
  loadCredentials: loadCredentials,
  getFunctionId: getFunctionId,
  getRegion: getRegion
}
