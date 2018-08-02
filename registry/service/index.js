/*
* Service
*/

const deploy = require('./lib/deploy.js')
const remove = require('./lib/remove.js')
const eg_script = require('./lib/eg_script.js')

module.exports = {
  deploy,
  remove,
  eg_script
}
